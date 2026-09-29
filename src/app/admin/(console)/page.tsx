import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { FORM_DEFINITIONS, STATUSES, STATUS_LABELS, formatDateTime, getDefinition } from "@/lib/forms/definitions";
import type { SubmissionRow, SubmissionStats } from "@/lib/submissions/types";
import BarList from "@/components/admin/BarList";
import DailyChart from "@/components/admin/DailyChart";
import StatusBadge from "@/components/portal/StatusBadge";

export const dynamic = "force-dynamic";

// Status palette: state colours (neutral / info / good / critical), always shown with a label.
const STATUS_COLORS = { draft: "#8a93a6", submitted: "#2a78d6", approved: "#1a8f4f", rejected: "#e34948" } as const;

const n = (v: number | undefined) => (v ?? 0).toLocaleString("en-ZA");

export default async function AdminDashboard() {
    const { supabase } = await requireAdminPage("/admin");

    const [statsRes, recentRes] = await Promise.all([
        supabase.rpc("submission_stats"),
        supabase
            .from("submissions")
            .select("id, reference, client_name, email, form_type, status, submitted_at, pdf_path, pdf_error")
            .neq("status", "draft")
            .order("submitted_at", { ascending: false, nullsFirst: false })
            .limit(8),
    ]);

    if (statsRes.error) {
        console.error("[admin] stats failed", statsRes.error);
        return (
            <>
                <Head />
                <div className="cd-alert cd-alert-error">
                    Dashboard statistics couldn&apos;t be loaded. Check that the database migration has been applied, then refresh.
                </div>
            </>
        );
    }

    const stats = statsRes.data as SubmissionStats;
    const recent = (recentRes.data ?? []) as Pick<SubmissionRow, "id" | "reference" | "client_name" | "email" | "form_type" | "status" | "submitted_at" | "pdf_path" | "pdf_error">[];
    const decided = (stats.by_status.approved ?? 0) + (stats.by_status.rejected ?? 0);
    const approvalRate = decided ? Math.round(((stats.by_status.approved ?? 0) / decided) * 100) : null;
    const last30 = stats.daily.reduce((s, d) => s + d.count, 0);

    return (
        <>
            <Head />

            <div className="cd-kpis">
                <Kpi label="Total submissions" value={n(stats.total)} meta={`${n(stats.unique_clients)} unique clients`} />
                <Kpi label="Today" value={n(stats.today)} meta="Since midnight (SAST)" />
                <Kpi label="This week" value={n(stats.this_week)} meta="Since Monday" />
                <Kpi label="This month" value={n(stats.this_month)} meta={`Last month: ${n(stats.last_month)}`} />
                <Kpi label="Awaiting review" value={n(stats.awaiting_review)} meta={<Link href="/admin/submissions?status=submitted">Open review queue →</Link>} />
                <Kpi label="Approval rate" value={approvalRate === null ? "—" : `${approvalRate}%`} meta={`${n(decided)} reviewed`} />
                <Kpi label="Drafts in progress" value={n(stats.drafts)} meta="Started, not yet submitted" />
                <Kpi
                    label="PDF issues"
                    value={n(stats.pdf_issues)}
                    meta={stats.pdf_issues ? <Link href="/admin/submissions?pdf=issues">Review failures →</Link> : "All PDFs generated"}
                />
            </div>

            <div className="cd-grid-2" style={{ marginBottom: 16 }}>
                <section className="cd-card" style={{ marginBottom: 0 }}>
                    <div className="cd-card-header">
                        <div>
                            <h2>Submissions per day</h2>
                            <p>Last 30 days · {n(last30)} submitted</p>
                        </div>
                    </div>
                    <div className="cd-card-body">
                        <DailyChart data={stats.daily} />
                    </div>
                </section>

                <section className="cd-card" style={{ marginBottom: 0 }}>
                    <div className="cd-card-header">
                        <div>
                            <h2>Status breakdown</h2>
                            <p>All records, including drafts</p>
                        </div>
                    </div>
                    <div className="cd-card-body">
                        <BarList
                            items={STATUSES.map((s) => ({
                                key: s,
                                label: STATUS_LABELS[s],
                                value: stats.by_status[s] ?? 0,
                                color: STATUS_COLORS[s],
                                href: `/admin/submissions?status=${s}`,
                            }))}
                        />
                    </div>
                </section>
            </div>

            <div className="cd-grid-2">
                <section className="cd-card">
                    <div className="cd-card-header">
                        <div>
                            <h2>Latest submissions</h2>
                        </div>
                        <Link href="/admin/submissions" className="cd-btn cd-btn-sm cd-btn-outline">
                            View all
                        </Link>
                    </div>
                    {recent.length === 0 ? (
                        <div className="cd-empty">
                            <h3>No submissions yet</h3>
                            <p>Submitted forms will appear here.</p>
                        </div>
                    ) : (
                        <div className="cd-table-wrap">
                            <table className="cd-table">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Client</th>
                                        <th>Form</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((s) => (
                                        <tr key={s.id}>
                                            <td className="cd-ref">
                                                <Link href={`/admin/submissions/${s.id}`}>{s.reference}</Link>
                                            </td>
                                            <td>
                                                <div>{s.client_name || "—"}</div>
                                                <div className="cd-sub">{s.email || ""}</div>
                                            </td>
                                            <td>{getDefinition(s.form_type)?.title ?? s.form_type}</td>
                                            <td>
                                                <StatusBadge status={s.status} />
                                            </td>
                                            <td>{formatDateTime(s.submitted_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="cd-card">
                    <div className="cd-card-header">
                        <div>
                            <h2>By form type</h2>
                            <p>Submitted forms</p>
                        </div>
                    </div>
                    <div className="cd-card-body">
                        <BarList
                            items={FORM_DEFINITIONS.map((d) => ({
                                key: d.id,
                                label: d.title,
                                value: stats.by_type[d.id] ?? 0,
                                color: "#2a78d6",
                                href: `/admin/submissions?type=${d.id}`,
                            }))}
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

function Head() {
    return (
        <div className="cd-admin-head">
            <div>
                <h1>Dashboard</h1>
                <p>Overview of every form submitted through the client portal.</p>
            </div>
            <Link href="/admin/submissions" className="cd-btn cd-btn-primary">
                Manage submissions
            </Link>
        </div>
    );
}

function Kpi({ label, value, meta }: { label: string; value: string; meta?: React.ReactNode }) {
    return (
        <div className="cd-kpi">
            <div className="cd-kpi-label">{label}</div>
            <div className="cd-kpi-value">{value}</div>
            {meta && <div className="cd-kpi-meta">{meta}</div>}
        </div>
    );
}
