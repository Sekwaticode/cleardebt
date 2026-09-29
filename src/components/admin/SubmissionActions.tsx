"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, STATUS_LABELS, type SubmissionStatus } from "@/lib/forms/definitions";
import { useToast } from "@/components/portal/Toast";

async function call(url: string, init: RequestInit): Promise<{ ok: boolean; error?: string }> {
    try {
        const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
            window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
            return { ok: false, error: "Your session has expired." };
        }
        return res.ok ? { ok: true } : { ok: false, error: body.error ?? "Request failed." };
    } catch {
        return { ok: false, error: "Couldn't reach the server — check your connection." };
    }
}

export function StatusForm({ id, status, note }: { id: string; status: SubmissionStatus; note: string | null }) {
    const router = useRouter();
    const toast = useToast();
    const [value, setValue] = useState<SubmissionStatus>(status);
    const [text, setText] = useState(note ?? "");
    const [busy, setBusy] = useState(false);
    const isDraft = status === "draft";

    if (isDraft) {
        return <p className="cd-muted" style={{ margin: 0 }}>This form is still a draft. It can be reviewed once the client submits it.</p>;
    }

    return (
        <form
            className="cd-stack"
            onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const r = await call(`/api/admin/submissions/${id}`, { method: "PATCH", body: JSON.stringify({ status: value, note: text }) });
                setBusy(false);
                if (!r.ok) return toast(r.error!, "error");
                toast("Status updated.", "success");
                router.refresh();
            }}
        >
            <div className="cd-field">
                <label htmlFor="st-status">Status</label>
                <select id="st-status" className="cd-select" value={value} onChange={(e) => setValue(e.target.value as SubmissionStatus)}>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s === "draft" ? "Draft (return to client for edits)" : STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>
            </div>
            <div className="cd-field">
                <label htmlFor="st-note">Internal note</label>
                <textarea id="st-note" className="cd-textarea" style={{ minHeight: 72 }} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Optional — reason for the decision" />
            </div>
            <button type="submit" className="cd-btn cd-btn-primary" disabled={busy || (value === status && text === (note ?? ""))}>
                {busy && <span className="cd-spinner" aria-hidden />}
                Save status
            </button>
        </form>
    );
}

export function PdfPanel({ id, available, generatedAt, error }: { id: string; available: boolean; generatedAt: string | null; error: string | null }) {
    const router = useRouter();
    const toast = useToast();
    const [busy, setBusy] = useState(false);
    const [version, setVersion] = useState(0);
    const url = `/api/submissions/${id}/pdf`;

    const regenerate = async () => {
        setBusy(true);
        const r = await call(`/api/admin/submissions/${id}/pdf`, { method: "POST" });
        setBusy(false);
        if (!r.ok) {
            toast(r.error!, "error");
        } else {
            toast("PDF regenerated from the stored data.", "success");
            setVersion((v) => v + 1);
        }
        router.refresh();
    };

    return (
        <div className="cd-stack">
            {error && (
                <div className="cd-alert cd-alert-error" style={{ marginBottom: 0 }}>
                    <strong>Last generation failed:</strong> {error}
                </div>
            )}
            <div className="cd-actions">
                <a className="cd-btn cd-btn-sm cd-btn-outline" href={url} target="_blank" rel="noopener">
                    Open in new tab
                </a>
                <a className="cd-btn cd-btn-sm cd-btn-outline" href={`${url}?download=1`}>
                    Download
                </a>
                <button type="button" className="cd-btn cd-btn-sm cd-btn-primary" onClick={regenerate} disabled={busy}>
                    {busy && <span className="cd-spinner" aria-hidden />}
                    {available ? "Regenerate PDF" : "Generate PDF"}
                </button>
            </div>
            {generatedAt && <span className="cd-muted" style={{ fontSize: 12.5 }}>Last generated {generatedAt}</span>}
            {available || version > 0 ? (
                <iframe key={version} className="cd-pdf-frame" src={`${url}#view=FitH`} title="Submission PDF preview" />
            ) : (
                <div className="cd-empty" style={{ border: "1px dashed var(--cd-border-strong)", borderRadius: 8 }}>
                    <h3>No PDF stored yet</h3>
                    <p>Generate it from the stored submission data.</p>
                </div>
            )}
        </div>
    );
}

export function DeleteSubmission({ id, reference }: { id: string; reference: string }) {
    const router = useRouter();
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [busy, setBusy] = useState(false);

    return (
        <>
            <button type="button" className="cd-btn cd-btn-sm cd-btn-outline" style={{ color: "var(--cd-danger)" }} onClick={() => setOpen(true)}>
                Delete submission
            </button>
            {open && (
                <div className="cd-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="del-title" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
                    <div className="cd-modal">
                        <div className="cd-modal-header" id="del-title">
                            Delete {reference}?
                        </div>
                        <div className="cd-modal-body cd-stack">
                            <span>This permanently deletes the submission, its signatures and its PDF. This can&apos;t be undone.</span>
                            <div className="cd-field">
                                <label htmlFor="del-confirm">
                                    Type <strong>{reference}</strong> to confirm
                                </label>
                                <input id="del-confirm" className="cd-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
                            </div>
                        </div>
                        <div className="cd-modal-footer">
                            <button type="button" className="cd-btn cd-btn-outline" onClick={() => setOpen(false)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="cd-btn cd-btn-danger"
                                disabled={busy || confirmText.trim() !== reference}
                                onClick={async () => {
                                    setBusy(true);
                                    const r = await call(`/api/admin/submissions/${id}`, { method: "DELETE" });
                                    setBusy(false);
                                    if (!r.ok) return toast(r.error!, "error");
                                    toast("Submission deleted.", "success");
                                    router.replace("/admin/submissions");
                                    router.refresh();
                                }}
                            >
                                {busy && <span className="cd-spinner" aria-hidden />}
                                Delete permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
