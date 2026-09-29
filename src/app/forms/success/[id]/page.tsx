import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { formatDateTime, getDefinition } from "@/lib/forms/definitions";
import { isUuid } from "@/lib/http";
import type { SubmissionRow } from "@/lib/submissions/types";
import StatusBadge from "@/components/portal/StatusBadge";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: { id: string } }) {
    if (!isUuid(params.id)) notFound();
    const { supabase, user } = await requireUserPage(`/forms/success/${params.id}`);

    const { data } = await supabase
        .from("submissions")
        .select("id, reference, form_type, status, submitted_at, pdf_path, client_name")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .maybeSingle();
    const row = data as Pick<SubmissionRow, "id" | "reference" | "form_type" | "status" | "submitted_at" | "pdf_path" | "client_name"> | null;
    if (!row) notFound();

    const def = getDefinition(row.form_type);
    if (row.status === "draft") redirect(`/forms/${def?.slug}?id=${row.id}`);

    const pdfUrl = `/api/submissions/${row.id}/pdf`;

    return (
        <div className="cd-auth" style={{ maxWidth: 620 }}>
            <section className="cd-card">
                <div className="cd-card-body" style={{ padding: 32, textAlign: "center" }}>
                    <div className="cd-success-icon" aria-hidden>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: 22, marginBottom: 8 }}>{def?.successTitle ?? "Form submitted"}</h1>
                    <p className="cd-muted" style={{ margin: "0 auto 20px", maxWidth: 440 }}>
                        {def?.successMessage}
                    </p>

                    <dl className="cd-meta-list" style={{ textAlign: "left", background: "var(--cd-surface-2)", border: "1px solid var(--cd-border)", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                        <div>
                            <dt>Reference</dt>
                            <dd className="cd-ref">{row.reference}</dd>
                        </div>
                        <div>
                            <dt>Form</dt>
                            <dd>{def?.title ?? row.form_type}</dd>
                        </div>
                        <div>
                            <dt>Submitted</dt>
                            <dd>{formatDateTime(row.submitted_at)}</dd>
                        </div>
                        <div>
                            <dt>Status</dt>
                            <dd>
                                <StatusBadge status={row.status} />
                            </dd>
                        </div>
                    </dl>

                    {!row.pdf_path && (
                        <div className="cd-alert cd-alert-info" style={{ textAlign: "left" }}>
                            Your PDF is still being prepared. It will be generated as soon as you open or download it.
                        </div>
                    )}

                    <div className="cd-actions" style={{ justifyContent: "center" }}>
                        <a className="cd-btn cd-btn-primary" href={`${pdfUrl}?download=1`}>
                            Download PDF
                        </a>
                        <a className="cd-btn cd-btn-outline" href={pdfUrl} target="_blank" rel="noopener">
                            View PDF
                        </a>
                        <Link className="cd-btn cd-btn-ghost" href="/forms">
                            Back to my forms
                        </Link>
                    </div>
                    <p className="cd-muted" style={{ fontSize: 12.5, marginTop: 18, marginBottom: 0 }}>
                        Keep your reference number for any enquiries. Your signed copy is always available from “My forms”.
                    </p>
                </div>
            </section>
        </div>
    );
}
