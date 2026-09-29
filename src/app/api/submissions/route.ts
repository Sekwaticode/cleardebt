import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/lib/http";
import { saveSubmission } from "@/lib/submissions/service";
import type { SaveSubmissionInput } from "@/lib/submissions/types";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4 * 1024 * 1024;

/** Save a draft or submit a form (creates the row on first save). */
export const POST = withAuth<Record<string, never>>("user", async (req, ctx) => {
    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) throw new HttpError(413, "The form is too large to send. Please try clearing and redrawing your signatures.");

    let body: SaveSubmissionInput;
    try {
        body = await req.json();
    } catch {
        throw new HttpError(400, "The form data could not be read.");
    }
    if (!body || typeof body !== "object") throw new HttpError(400, "The form data could not be read.");

    const result = await saveSubmission(ctx, body);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
});
