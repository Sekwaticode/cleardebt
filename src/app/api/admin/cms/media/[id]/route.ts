import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/lib/http";
import { deleteMedia, updateMediaAlt } from "@/lib/cms/service";

export const dynamic = "force-dynamic";

/** Update a file's default description (alt text). */
export const PATCH = withAuth<{ id: string }>("admin", async (req, _ctx, params) => {
    let body: { alt?: unknown };
    try {
        body = await req.json();
    } catch {
        throw new HttpError(400, "Invalid request.");
    }
    const media = await updateMediaAlt(params.id, body.alt);
    return NextResponse.json({ media });
});

/** Delete a file from the library. Refused while any section still uses it. */
export const DELETE = withAuth<{ id: string }>("admin", async (_req, _ctx, params) => {
    await deleteMedia(params.id);
    return NextResponse.json({ ok: true });
});
