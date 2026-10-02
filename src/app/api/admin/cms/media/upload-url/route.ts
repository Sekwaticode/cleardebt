import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/lib/http";
import { createUploadUrl } from "@/lib/cms/service";

export const dynamic = "force-dynamic";

/** Issue a one-time signed URL for uploading a single image or video. */
export const POST = withAuth("admin", async (req) => {
    let body: { mime?: unknown; size?: unknown };
    try {
        body = await req.json();
    } catch {
        throw new HttpError(400, "Invalid request.");
    }
    return NextResponse.json(await createUploadUrl(body));
});
