-- =====================================================================
-- Clear Debt — forms backend
--
-- Upgrades the pre-existing `submissions` table (created by the old static
-- site: reference, form_type, status, client_name, id_number, phone, email,
-- fields, signatures, pdf_path, created_at, updated_at) IN PLACE and adds:
--
--   profiles            one row per auth user, carries the role (client|admin)
--   submission_files    signatures + any future uploaded documents
--   submission_events   audit trail (who did what, incl. PDF failures)
--   submission_stats()  dashboard statistics (admin only)
--
-- Security model
--   * RLS on every table. Clients can only SELECT their own submissions;
--     admins can SELECT everything.
--   * No INSERT/UPDATE/DELETE policies for browser roles: every write goes
--     through Next.js route handlers, which validate input, check ownership
--     through the RLS-scoped client, then write with the service role.
--   * Storage buckets are private and have NO policies, so only the service
--     role (server-side) can read or write signatures and PDFs.
--
-- The script is idempotent: safe to re-run.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'client' check (role in ('client', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that existed before this migration.
insert into public.profiles (id, email, full_name)
select u.id, u.email, nullif(trim(u.raw_user_meta_data ->> 'full_name'), '')
from auth.users u
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Submissions (upgrade existing table)
-- ---------------------------------------------------------------------

create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  reference   text,
  form_type   text not null,
  status      text not null default 'draft',
  client_name text,
  id_number   text,
  phone       text,
  email       text,
  fields      jsonb not null default '{}'::jsonb,
  pdf_path    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Normalise column types left by the old schema (enum -> text, json -> jsonb).
do $$
declare
  col record;
begin
  for col in
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions'
      and column_name in ('form_type', 'status', 'fields')
  loop
    if col.column_name in ('form_type', 'status') and col.data_type <> 'text' then
      execute format('alter table public.submissions alter column %I drop default', col.column_name);
      execute format('alter table public.submissions alter column %I type text using %I::text',
                     col.column_name, col.column_name);
    elsif col.column_name = 'fields' and col.data_type <> 'jsonb' then
      execute 'alter table public.submissions alter column fields type jsonb using fields::jsonb';
    end if;
  end loop;
end;
$$;

alter table public.submissions
  alter column status set default 'draft',
  alter column fields set default '{}'::jsonb;

alter table public.submissions
  add column if not exists user_id          uuid references auth.users (id) on delete set null,
  add column if not exists form_version     integer not null default 1,
  add column if not exists submitted_at     timestamptz,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists pdf_error        text,
  add column if not exists status_note      text,
  add column if not exists reviewed_by      uuid references auth.users (id) on delete set null,
  add column if not exists reviewed_at      timestamptz,
  add column if not exists updated_by       uuid references auth.users (id) on delete set null;

-- Legacy rows: treat creation time as submission time.
update public.submissions
set submitted_at = created_at
where status <> 'draft' and submitted_at is null;

alter table public.submissions drop constraint if exists submissions_form_type_check;
alter table public.submissions add constraint submissions_form_type_check
  check (form_type in ('client_contract', 'counsellor_transfer', 'power_of_attorney'));

alter table public.submissions drop constraint if exists submissions_status_check;
alter table public.submissions add constraint submissions_status_check
  check (status in ('draft', 'submitted', 'approved', 'rejected'));

-- Human-friendly, collision-free reference: CD-CT-260929-00042
create sequence if not exists public.submission_reference_seq;

create or replace function public.assign_submission_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference :=
      'CD-'
      || case new.form_type
           when 'client_contract'     then 'CT'
           when 'counsellor_transfer' then 'TR'
           when 'power_of_attorney'   then 'PA'
           else 'XX'
         end
      || '-' || to_char(now() at time zone 'Africa/Johannesburg', 'YYMMDD')
      || '-' || lpad(nextval('public.submission_reference_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_assign_reference on public.submissions;
create trigger submissions_assign_reference
  before insert on public.submissions
  for each row execute function public.assign_submission_reference();

-- Backfill any legacy rows missing a reference, then lock it down.
update public.submissions
set reference = 'CD-LEGACY-' || upper(substr(replace(id::text, '-', ''), 1, 10))
where reference is null or reference = '';

alter table public.submissions alter column reference set not null;
create unique index if not exists submissions_reference_uidx on public.submissions (reference);

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

-- Lower-cased haystack for admin search (name, surname, email, phone, ID,
-- reference, plus the most useful form-specific fields).
alter table public.submissions
  add column if not exists search_text text generated always as (
    lower(
      coalesce(reference, '') || ' ' ||
      case form_type
        when 'client_contract'     then 'client contract'
        when 'counsellor_transfer' then 'debt counsellor transfer'
        when 'power_of_attorney'   then 'power of attorney poa'
        else ''
      end || ' ' ||
      coalesce(client_name, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(phone, '') || ' ' ||
      regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') || ' ' ||
      coalesce(id_number, '') || ' ' ||
      coalesce(fields ->> 'address', '') || ' ' ||
      coalesce(fields ->> 'principalAddress', '') || ' ' ||
      coalesce(fields ->> 'consumerAddress', '') || ' ' ||
      coalesce(fields ->> 'agentFullName', '') || ' ' ||
      coalesce(fields ->> 'agentIdNumber', '') || ' ' ||
      coalesce(fields ->> 'currentCounsellorName', '') || ' ' ||
      coalesce(fields ->> 'currentCounsellorCompany', '') || ' ' ||
      coalesce(fields ->> 'currentCounsellorNcr', '')
    )
  ) stored;

create index if not exists submissions_search_trgm_idx
  on public.submissions using gin (search_text extensions.gin_trgm_ops);
create index if not exists submissions_created_at_idx   on public.submissions (created_at desc);
create index if not exists submissions_submitted_at_idx on public.submissions (submitted_at desc);
create index if not exists submissions_user_id_idx      on public.submissions (user_id);
create index if not exists submissions_form_type_idx    on public.submissions (form_type);
create index if not exists submissions_status_idx       on public.submissions (status);
create index if not exists submissions_client_name_idx  on public.submissions (lower(client_name));

comment on column public.submissions.fields is
  'Form-specific answers keyed by the field names in src/lib/forms/definitions.ts';
comment on column public.submissions.search_text is
  'Generated haystack used by the admin search box (trigram indexed).';

-- ---------------------------------------------------------------------
-- Files (signatures + future uploaded documents)
-- ---------------------------------------------------------------------

create table if not exists public.submission_files (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  kind          text not null check (kind in ('signature', 'attachment')),
  field_name    text not null,
  bucket        text not null,
  storage_path  text not null,
  mime_type     text,
  size_bytes    integer,
  uploaded_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (submission_id, kind, field_name)
);

create index if not exists submission_files_submission_idx on public.submission_files (submission_id);

drop trigger if exists submission_files_set_updated_at on public.submission_files;
create trigger submission_files_set_updated_at
  before update on public.submission_files
  for each row execute function public.set_updated_at();

-- Migrate the old `signatures` jsonb map ({ padName: storagePath }) if present.
-- The legacy column itself is left in place (not dropped) to avoid data loss.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'signatures'
  ) then
    execute $sql$
      insert into public.submission_files (submission_id, kind, field_name, bucket, storage_path, mime_type)
      select s.id, 'signature', e.key, 'signatures', e.value, 'image/png'
      from public.submissions s,
           jsonb_each_text(coalesce(s.signatures::jsonb, '{}'::jsonb)) e
      where coalesce(e.value, '') <> ''
      on conflict (submission_id, kind, field_name) do nothing
    $sql$;
    execute $sql$ comment on column public.submissions.signatures is
      'DEPRECATED: superseded by public.submission_files' $sql$;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Audit trail
-- ---------------------------------------------------------------------

create table if not exists public.submission_events (
  id            bigint generated always as identity primary key,
  submission_id uuid references public.submissions (id) on delete set null,
  reference     text,
  actor_id      uuid references auth.users (id) on delete set null,
  action        text not null,
  details       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists submission_events_submission_idx
  on public.submission_events (submission_id, created_at desc);
create index if not exists submission_events_action_idx
  on public.submission_events (action, created_at desc);

-- ---------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------

alter table public.submissions       enable row level security;
alter table public.submission_files  enable row level security;
alter table public.submission_events enable row level security;

-- Remove every policy left over from the old static site (it allowed
-- anonymous inserts and broad reads), then define the new ones.
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('submissions', 'submission_files', 'submission_events')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end;
$$;

create policy "submissions: owner or admin can read"
  on public.submissions for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "submission_files: owner or admin can read"
  on public.submission_files for select
  to authenticated
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and (s.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy "submission_events: admin can read"
  on public.submission_events for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.submissions, public.submission_files, public.submission_events from anon;

-- ---------------------------------------------------------------------
-- Private storage buckets (service role only — no policies on purpose)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('signatures', 'signatures', false, 524288,   array['image/png']),
  ('pdfs',       'pdfs',       false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Drop any storage policies the old site created for these buckets.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ~ '(signatures|pdfs)' or coalesce(with_check, '') ~ '(signatures|pdfs)')
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Dashboard statistics (admin only)
--   "Submissions" = anything that has left draft; windows use submitted_at
--   in South African time. Drafts are reported separately.
-- ---------------------------------------------------------------------

create or replace function public.submission_stats(tz text default 'Africa/Johannesburg')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  now_local   timestamp := now() at time zone tz;
  day_start   timestamp := date_trunc('day', now_local);
  week_start  timestamp := date_trunc('week', now_local);
  month_start timestamp := date_trunc('month', now_local);
  result      jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with s as (
    select form_type, status, user_id, pdf_path, pdf_error,
           submitted_at at time zone tz as submitted_local
    from public.submissions
  ),
  sub as (select * from s where status <> 'draft')
  select jsonb_build_object(
    'total',           (select count(*) from sub),
    'drafts',          (select count(*) from s where status = 'draft'),
    'today',           (select count(*) from sub where submitted_local >= day_start),
    'this_week',       (select count(*) from sub where submitted_local >= week_start),
    'this_month',      (select count(*) from sub where submitted_local >= month_start),
    'last_month',      (select count(*) from sub
                         where submitted_local >= month_start - interval '1 month'
                           and submitted_local <  month_start),
    'awaiting_review', (select count(*) from sub where status = 'submitted'),
    'unique_clients',  (select count(distinct user_id) from sub),
    'pdf_issues',      (select count(*) from sub where pdf_path is null or pdf_error is not null),
    'by_status',       coalesce((select jsonb_object_agg(status, n)
                                   from (select status, count(*) n from s group by status) x), '{}'::jsonb),
    'by_type',         coalesce((select jsonb_object_agg(form_type, n)
                                   from (select form_type, count(*) n from sub group by form_type) x), '{}'::jsonb),
    'daily',           (select jsonb_agg(jsonb_build_object('date', d::date, 'count', coalesce(c.n, 0)) order by d)
                          from generate_series(day_start - interval '29 days', day_start, interval '1 day') d
                          left join (select date_trunc('day', submitted_local) as day, count(*) n
                                       from sub group by 1) c on c.day = d)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.submission_stats(text) from public, anon;
grant execute on function public.submission_stats(text) to authenticated;
