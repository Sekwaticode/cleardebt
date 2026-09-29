import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/lib/http";
import { deleteSubmission, updateStatus } from "@/lib/submissions/service";

export const dynamic = "force-dynamic";

/** Change a submission's review status (and optional note). */
export const PATCH = withAuth<{ id: string }>("admin", async (req, ctx, params) => {
    let body: { status?: unknown; note?: unknown };
    try {
        body = await req.json();
    } catch {
        throw new HttpError(400, "Invalid request.");
    }
    const row = await updateStatus(ctx, params.id, body.status, body.note);
    return NextResponse.json({ submission: row });
});

/** Permanently delete a submission together with its stored files. */
export const DELETE = withAuth<{ id: string }>("admin", async (_req, ctx, params) => {
    await deleteSubmission(ctx, params.id);
    return NextResponse.json({ ok: true });
});
