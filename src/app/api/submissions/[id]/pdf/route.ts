import { withAuth } from "@/lib/http";
import { getPdfForViewer } from "@/lib/submissions/service";

export const dynamic = "force-dynamic";

/**
 * Streams a submission's PDF to its owner or an admin. The file lives in a
 * private bucket, so it's proxied here instead of handing out storage URLs.
 * `?download=1` forces a download; otherwise it opens inline in the browser.
 */
export const GET = withAuth<{ id: string }>("user", async (req, ctx, params) => {
    const { bytes, reference } = await getPdfForViewer(ctx, params.id);
    const download = new URL(req.url).searchParams.get("download") === "1";
    const filename = `${reference.replace(/[^A-Za-z0-9_-]/g, "")}.pdf`;

    return new Response(Buffer.from(bytes), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Length": String(bytes.length),
            "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
});
