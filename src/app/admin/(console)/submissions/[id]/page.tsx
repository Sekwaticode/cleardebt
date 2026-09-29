import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { allFields, formatDateTime, formatFieldValue, getDefinition, type Block, type FieldDef } from "@/lib/forms/definitions";
import { isUuid } from "@/lib/http";
import { createServiceClient } from "@/lib/supabase/admin";
import { loadSignatureDataUrls } from "@/lib/submissions/service";
import type { SubmissionEventRow, SubmissionFileRow, SubmissionRow } from "@/lib/submissions/types";
import { DeleteSubmission, PdfPanel, StatusForm } from "@/components/admin/SubmissionActions";
import StatusBadge from "@/components/portal/StatusBadge";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
    created: "Draft created",
    draft_saved: "Draft saved",
    submitted: "Submitted by client",
    status_changed: "Status changed",
    pdf_generated: "PDF generated",
    pdf_regenerated: "PDF regenerated",
    pdf_failed: "PDF generation failed",
};

export default async function SubmissionDetail({ params }: { params: { id: string } }) {
    if (!isUuid(params.id)) notFound();
    const { supabase } = await requireAdminPage(`/admin/submissions/${params.id}`);

    const { data, error } = await supabase.from("submissions").select("*").eq("id", params.id).maybeSingle();
    if (error) throw error;
    if (!data) notFound();
    const s = data as SubmissionRow;
    const def = getDefinition(s.form_type);

    const [filesRes, eventsRes, signatures] = await Promise.all([
        supabase.from("submission_files").select("*").eq("submission_id", s.id),
        supabase.from("submission_events").select("*").eq("submission_id", s.id).order("created_at", { ascending: false }).limit(50),
        loadSignatureDataUrls(createServiceClient(), s.id).catch((err) => {
            console.error("[admin] could not load signatures", err);
            return {} as Record<string, string>;
        }),
    ]);
    const files = (filesRes.data ?? []) as SubmissionFileRow[];
    const events = (eventsRes.data ?? []) as SubmissionEventRow[];

    // Resolve people involved (owner, reviewer, event actors) to names/emails.
    const personIds = Array.from(new Set([s.user_id, s.reviewed_by, s.updated_by, ...events.map((e) => e.actor_id)].filter((v): v is string => !!v)));
    const { data: people } = personIds.length
        ? await supabase.from("profiles").select("id, email, full_name, role").in("id", personIds)
        : { data: [] as { id: string; email: string | null; full_name: string | null; role: string }[] };
    const person = (id: string | null) => {
        if (!id) return "—";
        const p = people?.find((x) => x.id === id);
        return p ? `${p.full_name || p.email}${p.role === "admin" ? " (admin)" : ""}` : "Unknown user";
    };

    const fields = s.fields ?? {};
    const knownNames = new Set(def ? allFields(def).map((f) => f.name) : []);
    const extra = Object.entries(fields).filter(([k]) => !knownNames.has(k));
    const attachments = files.filter((f) => f.kind === "attachment");

    return (
        <>
            <div className="cd-admin-head">
                <div>
                    <nav className="cd-breadcrumb" aria-label="Breadcrumb">
                        <Link href="/admin/submissions">Submissions</Link> / {s.reference}
                    </nav>
                    <h1 style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        {s.client_name || "Unnamed client"} <StatusBadge status={s.status} />
                    </h1>
                    <p>
                        {def?.title ?? s.form_type} · <span className="cd-ref">{s.reference}</span> · Submitted {formatDateTime(s.submitted_at)}
                    </p>
                </div>
                {s.status !== "draft" && (
                    <div className="cd-actions">
                        <a className="cd-btn cd-btn-outline" href={`/api/submissions/${s.id}/pdf`} target="_blank" rel="noopener">
                            View PDF
                        </a>
                        <a className="cd-btn cd-btn-primary" href={`/api/submissions/${s.id}/pdf?download=1`}>
                            Download PDF
                        </a>
                    </div>
                )}
            </div>

            <div className="cd-detail-layout">
                <div>
                    {!def && <div className="cd-alert cd-alert-warning">Unknown form type “{s.form_type}” — showing raw values.</div>}

                    {def?.sections.map((section) => (
                        <section className="cd-card" key={section.id}>
                            <div className="cd-card-header">
                                <h2>
                                    <span className="cd-step-badge">{section.badge}</span>
                                    {section.title}
                                </h2>
                            </div>
                            <div className="cd-card-body">
                                {section.blocks.map((block, i) => (
                                    <BlockDetail key={i} block={block} fields={fields} signatures={signatures} />
                                ))}
                            </div>
                        </section>
                    ))}

                    {extra.length > 0 && (
                        <section className="cd-card">
                            <div className="cd-card-header">
                                <h2>Additional information</h2>
                            </div>
                            <div className="cd-card-body">
                                <dl className="cd-dl">
                                    {extra.map(([k, v]) => (
                                        <div key={k}>
                                            <dt>{k}</dt>
                                            <dd>{formatFieldValue(undefined, v)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </section>
                    )}

                    {attachments.length > 0 && (
                        <section className="cd-card">
                            <div className="cd-card-header">
                                <h2>Uploaded documents</h2>
                            </div>
                            <div className="cd-card-body">
                                <ul className="cd-option-list">
                                    {attachments.map((f) => (
                                        <li key={f.id} className="is-on">
                                            {f.field_name} — {f.mime_type} · {Math.round((f.size_bytes ?? 0) / 1024)} KB
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                    {s.status !== "draft" && (
                        <section className="cd-card">
                            <div className="cd-card-header">
                                <div>
                                    <h2>Generated PDF</h2>
                                    <p>Rendered from the data stored in the database.</p>
                                </div>
                            </div>
                            <div className="cd-card-body">
                                <PdfPanel id={s.id} available={!!s.pdf_path} generatedAt={s.pdf_generated_at ? formatDateTime(s.pdf_generated_at) : null} error={s.pdf_error} />
                            </div>
                        </section>
                    )}
                </div>

                <div>
                    <section className="cd-card">
                        <div className="cd-card-header">
                            <h2>Summary</h2>
                        </div>
                        <div className="cd-card-body">
                            <dl className="cd-meta-list">
                                <Meta label="Reference" value={<span className="cd-ref">{s.reference}</span>} />
                                <Meta label="Form" value={def?.title ?? s.form_type} />
                                <Meta label="Status" value={<StatusBadge status={s.status} />} />
                                <Meta label="Submitted" value={formatDateTime(s.submitted_at)} />
                                <Meta label="Created" value={formatDateTime(s.created_at)} />
                                <Meta label="Last updated" value={formatDateTime(s.updated_at)} />
                                <Meta label="Client account" value={person(s.user_id)} />
                                <Meta label="ID number" value={s.id_number || "—"} />
                                <Meta label="Phone" value={s.phone || "—"} />
                                <Meta label="Email" value={s.email || "—"} />
                                {s.reviewed_at && <Meta label="Reviewed" value={`${formatDateTime(s.reviewed_at)} by ${person(s.reviewed_by)}`} />}
                            </dl>
                        </div>
                    </section>

                    <section className="cd-card">
                        <div className="cd-card-header">
                            <h2>Review</h2>
                        </div>
                        <div className="cd-card-body">
                            <StatusForm id={s.id} status={s.status} note={s.status_note} />
                        </div>
                    </section>

                    <section className="cd-card">
                        <div className="cd-card-header">
                            <h2>Activity</h2>
                        </div>
                        <div className="cd-card-body">
                            {events.length === 0 ? (
                                <p className="cd-muted" style={{ margin: 0 }}>
                                    No activity recorded.
                                </p>
                            ) : (
                                <ol className="cd-timeline">
                                    {events.map((e) => (
                                        <li key={e.id}>
                                            <span className={`cd-dot${e.action === "pdf_failed" ? " is-error" : e.action === "submitted" ? " is-ok" : ""}`} />
                                            <div>
                                                <strong>{EVENT_LABELS[e.action] ?? e.action}</strong>
                                                {e.action === "status_changed" && (
                                                    <> — {String(e.details.from)} → {String(e.details.to)}</>
                                                )}
                                                {e.action === "pdf_failed" && typeof e.details.message === "string" && <div className="cd-muted">{e.details.message}</div>}
                                                {e.action === "status_changed" && typeof e.details.note === "string" && <div className="cd-muted">“{e.details.note}”</div>}
                                                <small>
                                                    {formatDateTime(e.created_at)} · {person(e.actor_id)}
                                                </small>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </section>

                    <section className="cd-card">
                        <div className="cd-card-header">
                            <h2>Danger zone</h2>
                        </div>
                        <div className="cd-card-body">
                            <DeleteSubmission id={s.id} reference={s.reference} />
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

function BlockDetail({ block, fields, signatures }: { block: Block; fields: Record<string, unknown>; signatures: Record<string, string> }) {
    switch (block.kind) {
        case "static":
            return (
                <dl className="cd-dl" style={{ marginBottom: 14 }}>
                    {block.items.map((it) => (
                        <div key={it.label} className={it.span === 2 ? "cd-span-2" : undefined}>
                            <dt>{it.label}</dt>
                            <dd>{it.value}</dd>
                        </div>
                    ))}
                </dl>
            );
        case "paragraphs":
        case "list":
            // Contract wording the client agreed to — shown compactly for context.
            return (
                <div className="cd-terms">
                    {block.kind === "paragraphs"
                        ? block.items.map((p, i) => (
                              <p key={i}>
                                  {p.lead && <strong>{p.lead} </strong>}
                                  {p.text}
                              </p>
                          ))
                        : block.items.map((t, i) => <p key={i}>{`${i + 1}. ${t}`}</p>)}
                </div>
            );
        case "fields":
            return (
                <dl className="cd-dl" style={{ marginBottom: 14 }}>
                    {block.fields.map((f) => (
                        <div key={f.name} className={f.span === 2 || f.type === "checkboxGroup" || f.type === "checkbox" ? "cd-span-2" : undefined}>
                            <dt>{f.type === "checkbox" ? "Acknowledgement" : f.label}</dt>
                            <dd>
                                <FieldValueView field={f} value={fields[f.name]} />
                            </dd>
                        </div>
                    ))}
                </dl>
            );
        case "signatures":
            return (
                <div className="cd-sig-grid" style={{ marginBottom: 14 }}>
                    {block.signatures.map((sig) => (
                        <div key={sig.name} className="cd-field">
                            <span className="cd-label">
                                {sig.label}
                                {sig.required && <span className="cd-req">*</span>}
                            </span>
                            <div className="cd-signature-block">
                                {signatures[sig.name] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img className="cd-signature-img" src={signatures[sig.name]} alt={`${sig.label}`} />
                                ) : (
                                    <div className="cd-empty" style={{ padding: "48px 12px" }}>
                                        Not signed
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
    }
}

function FieldValueView({ field, value }: { field: FieldDef; value: unknown }) {
    if (field.type === "checkboxGroup") {
        const picked = new Set(Array.isArray(value) ? value.map(String) : []);
        return (
            <ul className="cd-option-list">
                {field.options?.map((o) => (
                    <li key={o.value} className={picked.has(o.value) ? "is-on" : undefined}>
                        <span className="cd-tick" aria-hidden>
                            {picked.has(o.value) ? "✓" : ""}
                        </span>
                        {o.label}
                        <span className="sr-only">{picked.has(o.value) ? " (selected)" : " (not selected)"}</span>
                    </li>
                ))}
            </ul>
        );
    }
    if (field.type === "checkbox") {
        const on = value === true || (Array.isArray(value) && value.length > 0);
        return (
            <ul className="cd-option-list">
                <li className={on ? "is-on" : undefined}>
                    <span className="cd-tick" aria-hidden>
                        {on ? "✓" : ""}
                    </span>
                    {field.label}
                    <span className="sr-only">{on ? " (accepted)" : " (not accepted)"}</span>
                </li>
            </ul>
        );
    }
    return <>{formatFieldValue(field, value)}</>;
}
