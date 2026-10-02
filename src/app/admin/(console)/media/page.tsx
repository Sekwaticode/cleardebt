import { requireAdminPage } from "@/lib/auth";
import { formatDate } from "@/lib/forms/definitions";
import { findMediaUsage } from "@/lib/cms/service";
import type { MediaRow } from "@/lib/cms/types";
import MediaLibrary, { type LibraryItem } from "@/components/admin/cms/MediaLibrary";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
    const { supabase } = await requireAdminPage("/admin/media");

    const { data, error } = await supabase.from("site_media").select("*").order("created_at", { ascending: false }).limit(500);
    const rows = (data ?? []) as MediaRow[];
    const usage = rows.length ? await findMediaUsage(rows.map((r) => r.url)) : {};
    const items: LibraryItem[] = rows.map((r) => ({ ...r, usedBy: usage[r.url] ?? [], uploaded: formatDate(r.created_at) }));

    return (
        <>
            <div className="cd-admin-head">
                <div>
                    <h1>Media library</h1>
                    <p>Images and videos for the public website. You can pick them from any image or video field in Website content.</p>
                </div>
            </div>
            {error && (
                <div className="cd-alert cd-alert-error">
                    The media library couldn&apos;t be read ({error.message}). Has the migration <code>20261002120000_site_cms.sql</code> been run?
                </div>
            )}
            <MediaLibrary items={items} />
        </>
    );
}
