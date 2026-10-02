import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/lib/http";
import { registerMedia } from "@/lib/cms/service";
import type { MediaRow } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

/** List the media library (newest first), optionally only images or videos. */
export const GET = withAuth("admin", async (req, ctx) => {
    const kind = new URL(req.url).searchParams.get("kind");
    let query = ctx.supabase.from("site_media").select("*").order("created_at", { ascending: false }).limit(500);
    if (kind === "image" || kind === "video") query = query.eq("kind", kind);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ media: (data ?? []) as MediaRow[] }, { headers: { "Cache-Control": "no-store" } });
});

/** Register a file the browser has just uploaded with a signed upload URL. */
export const POST = withAuth("admin", async (req, ctx) => {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        throw new HttpError(400, "Invalid request.");
    }
    const media = await registerMedia(ctx, body);
    return NextResponse.json({ media });
});
