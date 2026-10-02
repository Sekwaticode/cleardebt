import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/lib/http";
import { resetSection, saveSection } from "@/lib/cms/service";

export const dynamic = "force-dynamic";

/** Create or update a section's content. Only schema fields are kept. */
export const PUT = withAuth<{ key: string }>("admin", async (req, ctx, params) => {
    let body: { content?: unknown };
    try {
        body = await req.json();
    } catch {
        throw new HttpError(400, "Invalid request.");
    }
    const saved = await saveSection(ctx, params.key, body.content);
    return NextResponse.json({ ok: true, updatedAt: saved.updated_at });
});

/** Delete the custom content so the section shows its built-in defaults. */
export const DELETE = withAuth<{ key: string }>("admin", async (_req, ctx, params) => {
    await resetSection(ctx, params.key);
    return NextResponse.json({ ok: true });
});
