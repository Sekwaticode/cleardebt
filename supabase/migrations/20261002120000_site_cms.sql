-- =====================================================================
-- Clear Debt — website content management (CMS)
--
--   site_content            one row per editable section; `content` holds
--                           ONLY the texts, links and media the schema in
--                           src/lib/cms/sections.ts allows. No row = the
--                           section shows its built-in default content.
--   site_content_revisions  every save / reset / restore, for history and
--                           one-click restore.
--   site_media              images and videos uploaded through the admin
--                           media library (files live in the public
--                           `site-media` bucket).
--
-- Security model (same as the forms backend)
--   * RLS on every table; only admins can SELECT. No INSERT/UPDATE/DELETE
--     policies: every write goes through admin-only Next.js route handlers
--     that validate the content against the schema, then write with the
--     service role.
--   * The public website reads content server-side with the service role.
--   * `site-media` is a PUBLIC bucket (website images must be viewable by
--     anyone) with no storage policies: uploads only happen through signed
--     upload URLs issued to admins by the server.
--
-- Requires 20260929120000_forms_backend.sql (set_updated_at, is_admin).
-- The script is idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Section content
-- ---------------------------------------------------------------------

create table if not exists public.site_content (
  section     text primary key,
  content     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

comment on table public.site_content is
  'Editable website content, one row per section key in src/lib/cms/sections.ts';

-- ---------------------------------------------------------------------
-- Revision history
-- ---------------------------------------------------------------------

create table if not exists public.site_content_revisions (
  id          bigint generated always as identity primary key,
  section     text not null,
  action      text not null check (action in ('update', 'reset', 'restore')),
  content     jsonb,             -- null for a reset (back to the defaults)
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists site_content_revisions_section_idx
  on public.site_content_revisions (section, created_at desc);

-- ---------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------

create table if not exists public.site_media (
  id             uuid primary key default gen_random_uuid(),
  bucket         text not null default 'site-media',
  path           text not null unique,
  url            text not null,
  kind           text not null check (kind in ('image', 'video')),
  mime_type      text not null,
  size_bytes     integer,
  width          integer,
  height         integer,
  alt            text not null default '',
  original_name  text,
  uploaded_by    uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists site_media_created_at_idx on public.site_media (created_at desc);

drop trigger if exists site_media_set_updated_at on public.site_media;
create trigger site_media_set_updated_at
  before update on public.site_media
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row-level security (admin read only; writes via the service role)
-- ---------------------------------------------------------------------

alter table public.site_content           enable row level security;
alter table public.site_content_revisions enable row level security;
alter table public.site_media             enable row level security;

drop policy if exists "site_content: admin can read" on public.site_content;
create policy "site_content: admin can read"
  on public.site_content for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "site_content_revisions: admin can read" on public.site_content_revisions;
create policy "site_content_revisions: admin can read"
  on public.site_content_revisions for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "site_media: admin can read" on public.site_media;
create policy "site_media: admin can read"
  on public.site_media for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.site_content, public.site_content_revisions, public.site_media from anon;

-- ---------------------------------------------------------------------
-- Public media bucket (25 MB cap for videos; images are capped lower in
-- the app). SVG is deliberately not allowed: it can carry scripts.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media', 'site-media', true, 26214400,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
  set public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
