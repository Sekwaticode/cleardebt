import "server-only";
import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { SessionContext } from "@/lib/auth";
import { HttpError, isUuid } from "@/lib/http";
import { createServiceClient } from "@/lib/supabase/admin";
import { CMS_CACHE_TAG } from "./content";
import { DEFAULT_CONTENT } from "./defaults";
import { getSectionDef } from "./sections";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, MEDIA_BUCKET, VIDEO_MIME_TYPES, type MediaRow } from "./types";
import { mergeWithDefaults, sanitizeContent } from "./validate";

/* ==========================================================
   CMS writes. Callers are admin-only route handlers (withAuth("admin")).
   Content is validated against the section schema before anything is
   written, so only texts, links and media can ever be stored.
   ========================================================== */

/** Rebuilds every public page that reads CMS content. */
function revalidateSite() {
    revalidateTag(CMS_CACHE_TAG);
    revalidatePath("/", "layout");
}

function requireSection(key: string) {
    const def = getSectionDef(key);
    if (!def) throw new HttpError(404, "Unknown website section.");
    return def;
}

async function writeSection(ctx: SessionContext, key: string, content: Record<string, unknown>, action: "update" | "restore") {
    const service = createServiceClient();
    const { data, error } = await service
        .from("site_content")
        .upsert({ section: key, content, updated_by: ctx.user.id }, { onConflict: "section" })
        .select("section, updated_at")
        .single();
    if (error) throw error;

    const { error: revErr } = await service.from("site_content_revisions").insert({ section: key, action, content, created_by: ctx.user.id });
    if (revErr) console.error("[cms] could not record revision", revErr);

    revalidateSite();
    return data as { section: string; updated_at: string };
}

/** Create or update a section's content (upsert). */
export async function saveSection(ctx: SessionContext, key: string, input: unknown) {
    const def = requireSection(key);
    const { value, errors } = sanitizeContent(def, input);
    if (Object.keys(errors).length) throw new HttpError(422, "Please fix the highlighted fields.", { fieldErrors: errors });
    return writeSection(ctx, key, value, "update");
}

/** Delete a section's custom content so the site shows the built-in defaults again. */
export async function resetSection(ctx: SessionContext, key: string) {
    requireSection(key);
    const service = createServiceClient();
    const { error } = await service.from("site_content").delete().eq("section", key);
    if (error) throw error;
    const { error: revErr } = await service.from("site_content_revisions").insert({ section: key, action: "reset", content: null, created_by: ctx.user.id });
    if (revErr) console.error("[cms] could not record revision", revErr);
    revalidateSite();
}

/** Re-publish an earlier version of a section. */
export async function restoreRevision(ctx: SessionContext, key: string, revisionId: unknown) {
    const def = requireSection(key);
    const id = Number(revisionId);
    if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, "Invalid revision.");

    const { data: rev, error } = await ctx.supabase
        .from("site_content_revisions")
        .select("id, section, action, content")
        .eq("id", id)
        .maybeSingle();
    if (error) throw error;
    if (!rev || rev.section !== key) throw new HttpError(404, "That version no longer exists.");

    if (rev.content === null) {
        await resetSection(ctx, key);
        return null;
    }
    // The schema may have changed since this version was saved: fill gaps with
    // defaults, then validate exactly like a normal save.
    const merged = mergeWithDefaults(def.fields, rev.content, DEFAULT_CONTENT[def.key]);
    const { value, errors } = sanitizeContent(def, merged);
    if (Object.keys(errors).length) {
        throw new HttpError(422, "That version can't be restored because it no longer passes validation. Edit the section instead.");
    }
    return writeSection(ctx, key, value, "restore");
}

/* ----------------------------------------------------------
   Media library
   Uploads go straight from the browser to storage with a signed upload
   URL (so large files don't pass through the server), then the file is
   checked and registered here.
   ---------------------------------------------------------- */

const EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/webm": "webm",
};
const PATH_RE = /^(images|videos)\/\d{4}\/[0-9a-f-]{36}\.(png|jpg|webp|gif|avif|mp4|webm)$/;

function kindOf(mime: string): "image" | "video" | null {
    if (IMAGE_MIME_TYPES.includes(mime)) return "image";
    if (VIDEO_MIME_TYPES.includes(mime)) return "video";
    return null;
}

function checkSize(kind: "image" | "video", size: number) {
    const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (!(size > 0)) throw new HttpError(400, "The file is empty.");
    if (size > max) throw new HttpError(413, `${kind === "image" ? "Images" : "Videos"} can be up to ${max / 1024 / 1024} MB.`);
}

export async function createUploadUrl(input: { mime?: unknown; size?: unknown }) {
    const mime = String(input.mime ?? "");
    const kind = kindOf(mime);
    if (!kind) throw new HttpError(415, "Upload a PNG, JPEG, WebP, GIF or AVIF image, or an MP4 or WebM video.");
    checkSize(kind, Number(input.size));

    const path = `${kind}s/${new Date().getUTCFullYear()}/${randomUUID()}.${EXT[mime]}`;
    const { data, error } = await createServiceClient().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return { path: data.path, token: data.token, bucket: MEDIA_BUCKET };
}

export async function registerMedia(
    ctx: SessionContext,
    input: { path?: unknown; width?: unknown; height?: unknown; alt?: unknown; name?: unknown },
): Promise<MediaRow> {
    const path = String(input.path ?? "");
    if (!PATH_RE.test(path)) throw new HttpError(400, "Invalid upload.");

    const service = createServiceClient();
    const dir = path.slice(0, path.lastIndexOf("/"));
    const file = path.slice(path.lastIndexOf("/") + 1);
    const { data: listed, error: listErr } = await service.storage.from(MEDIA_BUCKET).list(dir, { search: file, limit: 1 });
    if (listErr) throw listErr;
    const obj = listed?.find((o) => o.name === file);
    if (!obj) throw new HttpError(400, "The upload didn't finish. Please try again.");

    // Trust what storage recorded, not what the browser claimed.
    const mime = String(obj.metadata?.mimetype ?? "");
    const size = Number(obj.metadata?.size ?? 0);
    const kind = kindOf(mime);
    try {
        if (!kind || (kind === "image") !== path.startsWith("images/")) throw new HttpError(415, "That file type isn't allowed.");
        checkSize(kind, size);
    } catch (err) {
        await service.storage.from(MEDIA_BUCKET).remove([path]);
        throw err;
    }

    const dim = (v: unknown) => {
        const n = Math.round(Number(v));
        return Number.isFinite(n) && n > 0 && n <= 20000 ? n : null;
    };
    const width = dim(input.width);
    const height = dim(input.height);
    if (kind === "image" && (!width || !height)) {
        await service.storage.from(MEDIA_BUCKET).remove([path]);
        throw new HttpError(400, "That image couldn't be read. Please try a different file.");
    }

    const url = service.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    const { data, error } = await service
        .from("site_media")
        .insert({
            path,
            url,
            kind,
            mime_type: mime,
            size_bytes: size,
            width,
            height,
            alt: String(input.alt ?? "").trim().slice(0, 200),
            original_name: String(input.name ?? "").slice(0, 200) || null,
            uploaded_by: ctx.user.id,
        })
        .select("*")
        .single();
    if (error) throw error;
    return data as MediaRow;
}

export async function updateMediaAlt(id: string, alt: unknown) {
    if (!isUuid(id)) throw new HttpError(404, "File not found.");
    const value = String(alt ?? "").replace(/[\r\n]+/g, " ").trim();
    if (value.length > 200) throw new HttpError(400, "Keep the description under 200 characters.");
    const { data, error } = await createServiceClient().from("site_media").update({ alt: value }).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "File not found.");
    return data as MediaRow;
}

/** Section names whose current content references each URL. */
export async function findMediaUsage(urls: string[]): Promise<Record<string, string[]>> {
    const usage: Record<string, string[]> = Object.fromEntries(urls.map((u) => [u, []]));
    if (!urls.length) return usage;
    const { data, error } = await createServiceClient().from("site_content").select("section, content");
    if (error) throw error;
    for (const row of data ?? []) {
        const json = JSON.stringify(row.content);
        const name = getSectionDef(row.section)?.name ?? row.section;
        for (const u of urls) if (json.includes(u)) usage[u].push(name);
    }
    return usage;
}

export async function deleteMedia(id: string) {
    if (!isUuid(id)) throw new HttpError(404, "File not found.");
    const service = createServiceClient();
    const { data: row, error } = await service.from("site_media").select("id, path, url").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!row) throw new HttpError(404, "File not found.");

    const usedBy = (await findMediaUsage([row.url]))[row.url];
    if (usedBy.length) {
        throw new HttpError(409, `This file is still used in: ${usedBy.join(", ")}. Replace it there first.`, { usedBy });
    }

    const { error: rmErr } = await service.storage.from(MEDIA_BUCKET).remove([row.path]);
    if (rmErr) throw rmErr;
    const { error: delErr } = await service.from("site_media").delete().eq("id", id);
    if (delErr) throw delErr;
}
