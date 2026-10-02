"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaRow } from "@/lib/cms/types";
import { useToast } from "@/components/portal/Toast";
import { api, checkFile, uploadMedia } from "./api";

/** Modal for choosing (or uploading) an image or video from the media library. */
export default function MediaPicker({ kind, onSelect, onClose }: { kind: "image" | "video"; onSelect: (m: MediaRow) => void; onClose: () => void }) {
    const toast = useToast();
    const [media, setMedia] = useState<MediaRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api<{ media: MediaRow[] }>(`/api/admin/cms/media?kind=${kind}`, { method: "GET" })
            .then((r) => setMedia(r.media))
            .catch((e: Error) => setError(e.message));
    }, [kind]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!media || !q) return media;
        return media.filter((m) => `${m.original_name ?? ""} ${m.alt}`.toLowerCase().includes(q));
    }, [media, query]);

    const upload = async (file: File) => {
        const problem = checkFile(file, kind);
        if (problem) return toast(problem, "error");
        setUploading(true);
        try {
            const row = await uploadMedia(file);
            toast("Uploaded.", "success");
            onSelect(row);
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="cd-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cms-picker-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="cd-modal cd-modal-wide">
                <div className="cd-modal-header cd-picker-head" id="cms-picker-title">
                    <span>Choose {kind === "image" ? "an image" : "a video"}</span>
                    <div className="cd-actions">
                        <input className="cd-input cd-input-sm" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the media library" />
                        <button type="button" className="cd-btn cd-btn-sm cd-btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                            {uploading && <span className="cd-spinner" aria-hidden />}
                            Upload new
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            hidden
                            accept={kind === "image" ? "image/png,image/jpeg,image/webp,image/gif,image/avif" : "video/mp4,video/webm"}
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = "";
                                if (f) upload(f);
                            }}
                        />
                    </div>
                </div>
                <div className="cd-modal-body cd-picker-body">
                    {error ? (
                        <div className="cd-alert cd-alert-error">{error}</div>
                    ) : !filtered ? (
                        <div className="cd-empty">
                            <span className="cd-spinner" aria-hidden /> Loading the media library…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="cd-empty">
                            <h3>{media?.length ? "No matches" : `No ${kind}s uploaded yet`}</h3>
                            <p>Use “Upload new” to add one.</p>
                        </div>
                    ) : (
                        <ul className="cd-media-grid" role="list">
                            {filtered.map((m) => (
                                <li key={m.id}>
                                    <button type="button" className="cd-media-tile is-pickable" onClick={() => onSelect(m)} title={m.original_name ?? undefined}>
                                        <span className="cd-media-thumb">
                                            {m.kind === "image" ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={m.url} alt={m.alt} loading="lazy" />
                                            ) : (
                                                <video src={m.url} muted preload="metadata" />
                                            )}
                                        </span>
                                        <span className="cd-media-name">{m.original_name || m.alt || "Untitled"}</span>
                                        {m.width && m.height && (
                                            <span className="cd-muted">
                                                {m.width}×{m.height}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="cd-modal-footer">
                    <button type="button" className="cd-btn cd-btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
