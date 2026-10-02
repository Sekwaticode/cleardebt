"use client";

import { createClient } from "@/lib/supabase/client";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, VIDEO_MIME_TYPES, type MediaRow } from "@/lib/cms/types";

export class ApiError extends Error {
    constructor(
        message: string,
        public fieldErrors?: Record<string, string>,
    ) {
        super(message);
    }
}

/** JSON request to an admin API route. Throws ApiError with a user-safe message. */
export async function api<T = Record<string, unknown>>(url: string, init: { method: string; body?: unknown }): Promise<T> {
    let res: Response;
    try {
        res = await fetch(url, {
            method: init.method,
            headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
            body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        });
    } catch {
        throw new ApiError("Couldn't reach the server — check your connection.");
    }
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
        window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
        throw new ApiError("Your session has expired.");
    }
    if (!res.ok) throw new ApiError(body.error ?? "Request failed.", body.fieldErrors);
    return body as T;
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new ApiError(`“${file.name}” couldn't be read as an image.`));
        };
        img.src = url;
    });
}

function readVideoSize(file: File): Promise<{ width: number | null; height: number | null }> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        const done = (w: number | null, h: number | null) => {
            URL.revokeObjectURL(url);
            resolve({ width: w, height: h });
        };
        video.onloadedmetadata = () => done(video.videoWidth || null, video.videoHeight || null);
        video.onerror = () => done(null, null);
        video.src = url;
    });
}

/** Checks a file against the library's limits before uploading. Returns an error message or null. */
export function checkFile(file: File, accept: "image" | "video" | "any"): string | null {
    const isImage = IMAGE_MIME_TYPES.includes(file.type);
    const isVideo = VIDEO_MIME_TYPES.includes(file.type);
    if (accept === "image" && !isImage) return `“${file.name}” isn't a supported image (PNG, JPEG, WebP, GIF or AVIF).`;
    if (accept === "video" && !isVideo) return `“${file.name}” isn't a supported video (MP4 or WebM).`;
    if (!isImage && !isVideo) return `“${file.name}” isn't a supported file type.`;
    const max = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > max) return `“${file.name}” is larger than ${max / 1024 / 1024} MB.`;
    return null;
}

/**
 * Uploads one file to the media library: the server issues a signed upload
 * URL, the browser uploads straight to storage, then the server verifies
 * and registers the file.
 */
export async function uploadMedia(file: File, alt = ""): Promise<MediaRow> {
    const isImage = IMAGE_MIME_TYPES.includes(file.type);
    const size = isImage ? await readImageSize(file) : await readVideoSize(file);

    const slot = await api<{ path: string; token: string; bucket: string }>("/api/admin/cms/media/upload-url", {
        method: "POST",
        body: { mime: file.type, size: file.size },
    });

    const { error } = await createClient().storage.from(slot.bucket).uploadToSignedUrl(slot.path, slot.token, file, {
        contentType: file.type,
        cacheControl: "31536000",
    });
    if (error) throw new ApiError(`Uploading “${file.name}” failed: ${error.message}`);

    const { media } = await api<{ media: MediaRow }>("/api/admin/cms/media", {
        method: "POST",
        body: { path: slot.path, width: size.width, height: size.height, alt, name: file.name },
    });
    return media;
}

export function formatBytes(n: number | null | undefined) {
    if (!n) return "—";
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
