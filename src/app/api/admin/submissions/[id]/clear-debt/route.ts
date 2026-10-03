import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/lib/http";
import { updateAdminSection } from "@/lib/submissions/service";

export const dynamic = "force-dynamic";

/** Save Clear Debt's own fields and signature on a submission (admin only). */
export const PUT = withAuth<{ id: string }>("admin", async (req, ctx, params) => {
    let body: { fields?: unknown; signatures?: Record<string, unknown> };
    try {
        body = await req.json();
    } catch {
        throw new HttpError(400, "Invalid request.");
    }
    const result = await updateAdminSection(ctx, params.id, body);
    return NextResponse.json({ ok: true, ...result });
});
