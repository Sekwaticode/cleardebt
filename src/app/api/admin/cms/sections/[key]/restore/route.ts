import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/lib/http";
import { restoreRevision } from "@/lib/cms/service";

export const dynamic = "force-dynamic";

/** Re-publish an earlier version of a section. */
export const POST = withAuth<{ key: string }>("admin", async (req, ctx, params) => {
    let body: { revisionId?: unknown };
    try {
        body = await req.json();
    } catch {
        throw new HttpError(400, "Invalid request.");
    }
    await restoreRevision(ctx, params.key, body.revisionId);
    return NextResponse.json({ ok: true });
});
