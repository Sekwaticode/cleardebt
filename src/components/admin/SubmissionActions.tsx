"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, STATUS_LABELS, type SubmissionStatus } from "@/lib/forms/definitions";
import { useToast } from "@/components/portal/Toast";
import { SignaturePad, type SignaturePadHandle } from "@/components/portal/SignaturePad";

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
                <iframe key={`${version}-${generatedAt ?? ""}`} className="cd-pdf-frame" src={`${url}#view=FitH`} title="Submission PDF preview" />
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

/** The parts of a form only Clear Debt completes, e.g. the representative's name and signature. */
export function ClearDebtSection({
    id,
    fields,
    signatures,
    values,
    existingSignatures,
    submitted,
}: {
    id: string;
    fields: { name: string; label: string }[];
    signatures: { name: string; label: string; hint: string }[];
    values: Record<string, string>;
    existingSignatures: Record<string, string>;
    submitted: boolean;
}) {
    const router = useRouter();
    const toast = useToast();
    const [form, setForm] = useState<Record<string, string>>(values);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [changed, setChanged] = useState(false);
    const pads = useRef<Record<string, SignaturePadHandle | null>>({});

    const save = async () => {
        const sigs: Record<string, string | null> = {};
        for (const s of signatures) {
            const pad = pads.current[s.name];
            if (pad?.isDirty()) sigs[s.name] = pad.isEmpty() ? null : pad.toDataURL();
        }
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/submissions/${id}/clear-debt`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fields: form, signatures: sigs }),
            });
            const body = await res.json().catch(() => ({}));
            if (res.status === 401) {
                window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
                return;
            }
            if (!res.ok) {
                setErrors(body.fieldErrors ?? {});
                return toast(body.error ?? "Couldn't save the Clear Debt section.", "error");
            }
            setErrors({});
            Object.values(pads.current).forEach((p) => p?.markClean());
            setChanged(false);
            toast(
                submitted
                    ? body.pdfReady
                        ? "Saved. The PDF now includes Clear Debt's details."
                        : "Saved, but the PDF couldn't be rebuilt. Use “Regenerate PDF” to try again."
                    : "Saved.",
                body.pdfReady || !submitted ? "success" : "error",
            );
            router.refresh();
        } catch {
            toast("Couldn't reach the server — check your connection.", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="cd-stack">
            {fields.map((f) => (
                <div key={f.name} className={`cd-field${errors[f.name] ? " has-error" : ""}`}>
                    <label htmlFor={`cds-${f.name}`}>{f.label}</label>
                    <input
                        id={`cds-${f.name}`}
                        className="cd-input"
                        maxLength={300}
                        value={form[f.name] ?? ""}
                        onChange={(e) => {
                            setChanged(true);
                            setForm((v) => ({ ...v, [f.name]: e.target.value }));
                        }}
                    />
                    <div className="cd-error-msg">{errors[f.name]}</div>
                </div>
            ))}
            {signatures.map((s) => (
                <div key={s.name} className={`cd-field${errors[`signature:${s.name}`] ? " has-error" : ""}`}>
                    <span className="cd-label">{s.label}</span>
                    <div className="cd-signature-block">
                        <div className="cd-signature-title">
                            <span>{s.hint}</span>
                            {existingSignatures[s.name] && <span>Saved signature loaded</span>}
                        </div>
                        <SignaturePad
                            ref={(h) => {
                                pads.current[s.name] = h;
                            }}
                            label={s.label}
                            initialImage={existingSignatures[s.name]}
                            onChange={() => setChanged(true)}
                        />
                        <div className="cd-signature-actions">
                            <button type="button" className="cd-btn cd-btn-sm cd-btn-outline" onClick={() => pads.current[s.name]?.undo()}>
                                Undo
                            </button>
                            <button type="button" className="cd-btn cd-btn-sm cd-btn-outline" onClick={() => pads.current[s.name]?.clear()}>
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="cd-error-msg">{errors[`signature:${s.name}`]}</div>
                </div>
            ))}
            <div className="cd-actions">
                <button type="button" className="cd-btn cd-btn-primary" onClick={save} disabled={busy || !changed}>
                    {busy && <span className="cd-spinner" aria-hidden />}
                    Save Clear Debt section
                </button>
            </div>
        </div>
    );
}
