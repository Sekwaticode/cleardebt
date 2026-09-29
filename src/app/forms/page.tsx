import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { FORM_DEFINITIONS, formatDateTime, getDefinition } from "@/lib/forms/definitions";
import type { SubmissionRow } from "@/lib/submissions/types";
import PageHead from "@/components/portal/PageHead";
import StatusBadge from "@/components/portal/StatusBadge";

export const dynamic = "force-dynamic";

const ICONS: Record<string, string> = { client_contract: "CT", counsellor_transfer: "TR", power_of_attorney: "PA" };

export default async function FormsHub() {
    const { supabase, user, fullName } = await requireUserPage("/forms");

    // Explicit user filter: admins can read every row via RLS, but this page is "my forms".
    const { data, error } = await supabase
        .from("submissions")
        .select("id, reference, form_type, status, updated_at, submitted_at, pdf_path")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(100);
    const rows = (data ?? []) as Pick<SubmissionRow, "id" | "reference" | "form_type" | "status" | "updated_at" | "submitted_at" | "pdf_path">[];

    return (
        <>
            <PageHead
                crumbs={[{ label: "Home", href: "/" }, { label: "Forms" }]}
                title={fullName ? `Welcome, ${fullName.split(" ")[0]}` : "Your forms"}
                description="Choose a form to complete. You can save a draft and return later; once submitted, your signed PDF is available here."
            />

            <div className="cd-form-cards">
                {FORM_DEFINITIONS.map((def) => (
                    <div className="cd-form-card" key={def.id}>
                        <span className="cd-icon" aria-hidden>
                            {ICONS[def.id]}
                        </span>
                        <h3>{def.title}</h3>
                        <p>{def.summary}</p>
                        <div>
                            <Link href={`/forms/${def.slug}`} className="cd-btn cd-btn-primary cd-btn-sm">
                                Start form
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <section className="cd-card">
                <div className="cd-card-header">
                    <div>
                        <h2>My submissions</h2>
                        <p>Drafts you can continue and forms you&apos;ve submitted.</p>
                    </div>
                </div>
                {error ? (
                    <div className="cd-card-body">
                        <div className="cd-alert cd-alert-error">We couldn&apos;t load your submissions right now. Please refresh the page.</div>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="cd-empty">
                        <h3>No forms yet</h3>
                        <p>Start one of the forms above — it will appear here.</p>
                    </div>
                ) : (
                    <div className="cd-table-wrap">
                        <table className="cd-table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Form</th>
                                    <th>Status</th>
                                    <th>Last updated</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((s) => {
                                    const def = getDefinition(s.form_type);
                                    return (
                                        <tr key={s.id}>
                                            <td className="cd-ref">{s.reference}</td>
                                            <td>{def?.title ?? s.form_type}</td>
                                            <td>
                                                <StatusBadge status={s.status} />
                                            </td>
                                            <td>{formatDateTime(s.updated_at)}</td>
                                            <td>
                                                <div className="cd-row-actions">
                                                    {s.status === "draft" ? (
                                                        <Link className="cd-btn cd-btn-sm cd-btn-outline" href={`/forms/${def?.slug}?id=${s.id}`}>
                                                            Continue
                                                        </Link>
                                                    ) : (
                                                        <>
                                                            <a className="cd-btn cd-btn-sm cd-btn-outline" href={`/api/submissions/${s.id}/pdf`} target="_blank" rel="noopener">
                                                                View PDF
                                                            </a>
                                                            <a className="cd-btn cd-btn-sm cd-btn-outline" href={`/api/submissions/${s.id}/pdf?download=1`}>
                                                                Download
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}
