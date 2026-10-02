# Website content management (CMS)

Admins edit the public website's **content** at `/admin/content` and manage images and videos at `/admin/media`.
Only texts, links, numbers, images and videos can be changed. Layout, colours, class names and animations are
fixed in the components and can't be edited from the admin.

## Setup (one-time)

1. Run `supabase/migrations/20261002120000_site_cms.sql` (after the forms migration). Paste it into
   *Supabase → SQL Editor*, or use `supabase db push`. It creates `site_content`, `site_content_revisions`,
   `site_media` and the public `site-media` storage bucket, and it's safe to re-run.
2. No new environment variables are needed. `next.config.js` allows `next/image` to load files from the
   `site-media` bucket of the project in `NEXT_PUBLIC_SUPABASE_URL`.

Until the migration runs, or whenever Supabase can't be reached, the site shows its built-in content.

## How it fits together

| Piece | Location |
|---|---|
| Built-in (default) content for every section | `src/lib/cms/defaults.ts` |
| Editable-field schema per section (the allow-list) | `src/lib/cms/sections.ts` |
| Validation and merging (shared by browser and server) | `src/lib/cms/validate.ts` |
| Public read path (cached, falls back to defaults) | `src/lib/cms/content.ts` |
| Writes: save, reset, restore and media | `src/lib/cms/service.ts` |
| API routes (admin only) | `src/app/api/admin/cms/**` |
| Admin pages | `src/app/admin/(console)/content/**`, `src/app/admin/(console)/media` |
| Editor UI | `src/components/admin/cms/*` |

Every section component takes a `content` prop that defaults to its built-in content. The pages (`src/app/page.tsx`,
`about`, `contact`, `testimonials`) and the root layout (menu) load content with `getSiteContent()` and pass it down.

### Create, read, update and delete

- **Sections**: *Save & publish* creates or updates the section's row. *Reset to default* deletes the row, so the
  built-in content shows again. Every save, reset and restore is recorded in **History**, and any earlier version can
  be restored.
- **Lists** (FAQs, testimonials, team members, logos, menu items, footer links, service pills, steps, score factors,
  milestones): add, edit, reorder, duplicate and delete entries within each list's minimum and maximum. The bento grid
  is fixed at six cards because its layout depends on it.
- **Media**: upload (drag and drop, several files at once), search, edit the default description (alt text), copy the
  link and delete. A file can't be deleted while a section still uses it.

Publishing rebuilds the public pages immediately (`revalidateTag` + `revalidatePath`). The pages also refresh every
10 minutes as a safety net.

### Security model

- The only things that can be stored are the fields declared in `sections.ts`. The server rebuilds the content from
  that schema, so any other key (a colour, a class name, a style) is dropped. Text is rendered by React, never as HTML.
- Links must be relative (`/about`), anchors (`#`), `http(s)`, `mailto:` or `tel:`. `javascript:` and `data:` links are rejected.
- Images and videos must be bundled files or files in the `site-media` bucket.
- The tables are readable only by admins (RLS) and are written only by the server with the service role, after an
  admin check. Uploads go from the browser straight to storage using a one-time signed URL issued by the server.
  The server then checks the stored file's real type and size before registering it. SVG uploads are not allowed.

## Adding or changing an editable field

1. Add the default value in `defaults.ts`.
2. Add the field to the section's `fields` in `sections.ts`.
3. Render it from the `content` prop in the component.

Content saved earlier keeps working: missing fields are filled from the defaults. Don't rename an existing field
`name` without a migration, because stored content uses it as the key.

Default images are stored by their build URL (`/_next/static/media/...`), which is based on each file's content.
If you replace a bundled image file, sections saved with the old image need that image chosen again.
