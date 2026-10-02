import "server-only";
import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/admin";
import { DEFAULT_CONTENT, type SiteContent } from "./defaults";
import { SECTIONS } from "./sections";
import { mergeWithDefaults } from "./validate";

/** Cache tag invalidated whenever content is saved, reset or restored. */
export const CMS_CACHE_TAG = "site-content";

const loadRows = unstable_cache(
    async () => {
        const supabase = createServiceClient();
        const { data, error } = await supabase.from("site_content").select("section, content");
        if (error) throw error;
        return (data ?? []) as { section: string; content: unknown }[];
    },
    ["site-content-rows"],
    { tags: [CMS_CACHE_TAG], revalidate: 600 },
);

/**
 * Content for every section: what admins saved, filled in with the built-in
 * defaults. If Supabase isn't configured or can't be reached, the site keeps
 * working with the defaults (errors are thrown inside the cache so they
 * aren't cached).
 */
export async function getSiteContent(): Promise<SiteContent> {
    let rows: { section: string; content: unknown }[] = [];
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
            rows = await loadRows();
        } catch (err) {
            console.error("[cms] could not load site content; using defaults", err);
        }
    }
    const stored = new Map(rows.map((r) => [r.section, r.content]));
    const content = { ...DEFAULT_CONTENT } as Record<string, unknown>;
    for (const def of SECTIONS) {
        if (stored.has(def.key)) {
            content[def.key] = mergeWithDefaults(def.fields, stored.get(def.key), DEFAULT_CONTENT[def.key as keyof SiteContent]);
        }
    }
    return content as SiteContent;
}
