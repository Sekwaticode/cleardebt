import { NextResponse } from "next/server";
import { HttpError, isUuid, withAuth } from "@/lib/http";
import { generateAndStorePdf } from "@/lib/submissions/service";

export const dynamic = "force-dynamic";

/** Regenerate the PDF from the data currently stored in the database. */
export const POST = withAuth<{ id: string }>("admin", async (_req, ctx, params) => {
    if (!isUuid(params.id)) throw new HttpError(404, "Submission not found.");
    const { data, error } = await ctx.supabase.from("submissions").select("id, status").eq("id", params.id).maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "Submission not found.");
    if (data.status === "draft") throw new HttpError(409, "Drafts don't have a PDF until they're submitted.");

    try {
        await generateAndStorePdf(data.id, ctx.user.id);
    } catch {
        throw new HttpError(502, "PDF generation failed. The error has been recorded in the activity log.");
    }
    return NextResponse.json({ ok: true });
});
