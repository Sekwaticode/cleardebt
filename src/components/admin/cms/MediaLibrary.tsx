"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MediaRow } from "@/lib/cms/types";
import { useToast } from "@/components/portal/Toast";
import { api, checkFile, formatBytes, uploadMedia } from "./api";
import ConfirmDialog from "./ConfirmDialog";

export type LibraryItem = MediaRow & { usedBy: string[]; uploaded: string };

export default function MediaLibrary({ items }: { items: LibraryItem[] }) {
    const router = useRouter();
    const toast = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [kind, setKind] = useState<"all" | "image" | "video">("all");
    const [query, setQuery] = useState("");
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [toDelete, setToDelete] = useState<LibraryItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((m) => (kind === "all" || m.kind === kind) && (!q || `${m.original_name ?? ""} ${m.alt}`.toLowerCase().includes(q)));
    }, [items, kind, query]);

    const uploadAll = async (files: File[]) => {
        const ok: File[] = [];
        for (const f of files) {
            const problem = checkFile(f, "any");
            if (problem) toast(problem, "error");
            else ok.push(f);
        }
        if (!ok.length) return;
        setProgress({ done: 0, total: ok.length });
        let uploaded = 0;
        for (const f of ok) {
            try {
                await uploadMedia(f);
                uploaded++;
            } catch (e) {
                toast((e as Error).message, "error");
            }
            setProgress((p) => p && { ...p, done: p.done + 1 });
        }
        setProgress(null);
        if (uploaded) toast(`${uploaded} file${uploaded === 1 ? "" : "s"} uploaded.`, "success");
        router.refresh();
    };

    const remove = async () => {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await api(`/api/admin/cms/media/${toDelete.id}`, { method: "DELETE" });
            toast("File deleted.", "success");
            setToDelete(null);
            router.refresh();
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <section
                className={`cd-card cd-dropzone${dragging ? " is-dragging" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (!progress) uploadAll(Array.from(e.dataTransfer.files));
                }}
            >
                <div className="cd-card-body cd-dropzone-body">
                    <div>
                        <strong>Drop images or videos here</strong>
                        <p className="cd-muted" style={{ margin: "2px 0 0" }}>
                            PNG, JPEG, WebP, GIF or AVIF up to 8 MB · MP4 or WebM up to 25 MB
                        </p>
                    </div>
                    <button type="button" className="cd-btn cd-btn-primary" onClick={() => fileRef.current?.click()} disabled={!!progress}>
                        {progress && <span className="cd-spinner" aria-hidden />}
                        {progress ? `Uploading ${progress.done + 1} of ${progress.total}…` : "Upload files"}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        hidden
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm"
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            e.target.value = "";
                            uploadAll(files);
                        }}
                    />
                </div>
            </section>

            <section className="cd-card">
                <div className="cd-card-header">
                    <div className="cd-tabs" role="tablist" aria-label="File type">
                        {(["all", "image", "video"] as const).map((k) => (
                            <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "is-active" : undefined} onClick={() => setKind(k)}>
                                {k === "all" ? "All" : k === "image" ? "Images" : "Videos"}{" "}
                                <span className="cd-muted">{k === "all" ? items.length : items.filter((m) => m.kind === k).length}</span>
                            </button>
                        ))}
                    </div>
                    <input className="cd-input cd-input-sm" style={{ maxWidth: 240 }} placeholder="Search by name or description…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search files" />
                </div>
                <div className="cd-card-body">
                    {shown.length === 0 ? (
                        <div className="cd-empty">
                            <h3>{items.length ? "No matching files" : "The media library is empty"}</h3>
                            <p>{items.length ? "Try a different search." : "Upload images and videos to use them anywhere on the website."}</p>
                        </div>
                    ) : (
                        <ul className="cd-media-grid is-library" role="list">
                            {shown.map((m) => (
                                <MediaCard key={m.id} item={m} onDelete={() => setToDelete(m)} />
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {toDelete && (
                <ConfirmDialog
                    title={toDelete.usedBy.length ? "This file is in use" : "Delete this file?"}
                    confirmLabel={toDelete.usedBy.length ? "OK" : "Delete permanently"}
                    danger={!toDelete.usedBy.length}
                    busy={deleting}
                    onConfirm={toDelete.usedBy.length ? () => setToDelete(null) : remove}
                    onCancel={() => setToDelete(null)}
                >
                    {toDelete.usedBy.length ? (
                        <>
                            It&apos;s still used in <strong>{toDelete.usedBy.join(", ")}</strong>, so it can&apos;t be deleted until it is replaced there.
                        </>
                    ) : (
                        <>
                            “{toDelete.original_name || toDelete.alt || "This file"}” will be permanently removed. Older versions in a section&apos;s history that used it would show a missing image if restored.
                        </>
                    )}
                </ConfirmDialog>
            )}
        </>
    );
}

function MediaCard({ item, onDelete }: { item: LibraryItem; onDelete: () => void }) {
    const router = useRouter();
    const toast = useToast();
    const [alt, setAlt] = useState(item.alt);
    const [saving, setSaving] = useState(false);

    const saveAlt = async () => {
        if (alt.trim() === item.alt) return;
        setSaving(true);
        try {
            await api(`/api/admin/cms/media/${item.id}`, { method: "PATCH", body: { alt } });
            toast("Description saved.", "success");
            router.refresh();
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <li className="cd-media-tile">
            <a className="cd-media-thumb" href={item.url} target="_blank" rel="noopener" title="Open full size">
                {item.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.alt} loading="lazy" />
                ) : (
                    <video src={item.url} muted preload="metadata" />
                )}
                {item.kind === "video" && <span className="cd-media-badge">Video</span>}
            </a>
            <div className="cd-media-meta">
                <span className="cd-media-name" title={item.original_name ?? undefined}>
                    {item.original_name || "Untitled"}
                </span>
                <span className="cd-muted">
                    {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                    {formatBytes(item.size_bytes)} · {item.uploaded}
                </span>
                {item.usedBy.length > 0 ? (
                    <span className="cd-chip cd-chip-ok" title={item.usedBy.join(", ")}>
                        Used in {item.usedBy.length === 1 ? item.usedBy[0] : `${item.usedBy.length} sections`}
                    </span>
                ) : (
                    <span className="cd-chip">Not used</span>
                )}
                {item.kind === "image" && (
                    <input
                        className="cd-input cd-input-sm"
                        value={alt}
                        maxLength={200}
                        placeholder="Default description (alt text)"
                        aria-label="Default description (alt text)"
                        disabled={saving}
                        onChange={(e) => setAlt(e.target.value)}
                        onBlur={saveAlt}
                        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                    />
                )}
                <div className="cd-actions">
                    <button
                        type="button"
                        className="cd-btn cd-btn-sm cd-btn-ghost"
                        onClick={() => navigator.clipboard.writeText(item.url).then(() => toast("Link copied.", "success"))}
                    >
                        Copy link
                    </button>
                    <button type="button" className="cd-btn cd-btn-sm cd-btn-ghost" style={{ color: "var(--cd-danger)" }} onClick={onDelete}>
                        Delete
                    </button>
                </div>
            </div>
        </li>
    );
}
