import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { formatDate, formatDateTime, getDefinition, isFormTypeId, isStatus } from "@/lib/forms/definitions";
import type { SubmissionRow } from "@/lib/submissions/types";
import FilterBar, { type Filters } from "@/components/admin/FilterBar";
import StatusBadge from "@/components/portal/StatusBadge";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const SORTS = {
    created: "created_at",
    submitted: "submitted_at",
    name: "client_name",
    type: "form_type",
    status: "status",
    reference: "reference",
} as const;
type SortKey = keyof typeof SORTS;

type Row = Pick<
    SubmissionRow,
    "id" | "reference" | "form_type" | "status" | "client_name" | "email" | "phone" | "id_number" | "created_at" | "submitted_at" | "pdf_path" | "pdf_error"
>;

const isDate = (v: string | undefined) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

function nextDay(iso: string) {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}

export default async function SubmissionsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
    const { supabase } = await requireAdminPage("/admin/submissions");

    const filters: Filters = {
        q: (searchParams.q ?? "").slice(0, 100),
        type: isFormTypeId(searchParams.type) ? searchParams.type : "",
        status: isStatus(searchParams.status) ? searchParams.status : "",
        from: isDate(searchParams.from) ? searchParams.from! : "",
        to: isDate(searchParams.to) ? searchParams.to! : "",
        pdf: searchParams.pdf === "issues" ? "issues" : "",
        sort: searchParams.sort && searchParams.sort in SORTS ? searchParams.sort : "created",
        dir: searchParams.dir === "asc" ? "asc" : "desc",
    };
    const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

    let query = supabase
        .from("submissions")
        .select("id, reference, form_type, status, client_name, email, phone, id_number, created_at, submitted_at, pdf_path, pdf_error", { count: "exact" });

    // Every word must match somewhere in the indexed haystack (name, surname, email, phone, ID, ref, form…).
    const words = filters.q
        .toLowerCase()
        .replace(/[%_,()*\\"']/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 6);
    for (const w of words) query = query.ilike("search_text", `%${w}%`);

    if (filters.type) query = query.eq("form_type", filters.type);
    if (filters.status) query = query.eq("status", filters.status);
    // Dates are interpreted in South African time.
    if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00+02:00`);
    if (filters.to) query = query.lt("created_at", `${nextDay(filters.to)}T00:00:00+02:00`);
    if (filters.pdf === "issues") query = query.neq("status", "draft").or("pdf_path.is.null,pdf_error.not.is.null");

    const column = SORTS[filters.sort as SortKey];
    query = query.order(column, { ascending: filters.dir === "asc", nullsFirst: false });
    if (column !== "created_at") query = query.order("created_at", { ascending: false });

    const fromIdx = (page - 1) * PAGE_SIZE;
    const { data, error, count } = await query.range(fromIdx, fromIdx + PAGE_SIZE - 1);
    const rows = (data ?? []) as Row[];
    const total = count ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const href = (patch: Record<string, string | number>) => {
        const params = new URLSearchParams();
        Object.entries({ ...filters, page, ...patch }).forEach(([k, v]) => {
            // Defaults (page 1, newest first) are left out to keep URLs short.
            if (!v || (k === "page" && v === 1) || (k === "sort" && v === "created") || (k === "dir" && v === "desc")) return;
            params.set(k, String(v));
        });
        const qs = params.toString();
        return `/admin/submissions${qs ? `?${qs}` : ""}`;
    };

    const SortHeader = ({ k, label }: { k: SortKey; label: string }) => {
        const active = filters.sort === k;
        const nextDir = active && filters.dir === "desc" ? "asc" : active ? "desc" : k === "name" || k === "reference" || k === "type" ? "asc" : "desc";
        return (
            <th className={active ? "is-sorted" : undefined} aria-sort={active ? (filters.dir === "asc" ? "ascending" : "descending") : undefined}>
                <Link href={href({ sort: k, dir: nextDir, page: 1 })}>
                    {label}
                    <span className="cd-sort" aria-hidden>
                        {active ? (filters.dir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                </Link>
            </th>
        );
    };

    return (
        <>
            <div className="cd-admin-head">
                <div>
                    <h1>Submissions</h1>
                    <p>Search, filter and review every form submitted to Clear Debt.</p>
                </div>
            </div>

            <section className="cd-card">
                <FilterBar current={filters} />

                {error ? (
                    <div className="cd-card-body">
                        <div className="cd-alert cd-alert-error" style={{ marginBottom: 0 }}>
                            Submissions couldn&apos;t be loaded. Please refresh the page.
                        </div>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="cd-empty">
                        <h3>No submissions match your filters</h3>
                        <p>Try a different search or clear the filters.</p>
                    </div>
                ) : (
                    <div className="cd-table-wrap">
                        <table className="cd-table">
                            <thead>
                                <tr>
                                    <SortHeader k="reference" label="Reference" />
                                    <SortHeader k="name" label="Client" />
                                    <SortHeader k="type" label="Form type" />
                                    <SortHeader k="status" label="Status" />
                                    <SortHeader k="submitted" label="Submitted" />
                                    <SortHeader k="created" label="Created" />
                                    <th>PDF</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((s) => (
                                    <tr key={s.id}>
                                        <td className="cd-ref">
                                            <Link href={`/admin/submissions/${s.id}`}>{s.reference}</Link>
                                        </td>
                                        <td>
                                            <div>{s.client_name || "—"}</div>
                                            <div className="cd-sub">{[s.email, s.phone].filter(Boolean).join(" · ")}</div>
                                        </td>
                                        <td>{getDefinition(s.form_type)?.title ?? s.form_type}</td>
                                        <td>
                                            <StatusBadge status={s.status} />
                                        </td>
                                        <td title={formatDateTime(s.submitted_at)}>{formatDate(s.submitted_at)}</td>
                                        <td title={formatDateTime(s.created_at)}>{formatDate(s.created_at)}</td>
                                        <td>
                                            {s.status === "draft" ? (
                                                <span className="cd-muted">—</span>
                                            ) : s.pdf_error ? (
                                                <span className="cd-badge rejected">Failed</span>
                                            ) : s.pdf_path ? (
                                                <span className="cd-badge approved">Ready</span>
                                            ) : (
                                                <span className="cd-badge draft">Missing</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="cd-row-actions">
                                                <Link href={`/admin/submissions/${s.id}`} className="cd-btn cd-btn-sm cd-btn-outline">
                                                    Open
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="cd-pager">
                    <span>
                        {total === 0 ? "0 results" : `Showing ${fromIdx + 1}–${Math.min(fromIdx + PAGE_SIZE, total)} of ${total.toLocaleString("en-ZA")}`}
                    </span>
                    <div className="cd-actions">
                        <Link className="cd-btn cd-btn-sm cd-btn-outline" href={href({ page: page - 1 })} aria-disabled={page <= 1}>
                            ← Previous
                        </Link>
                        <span style={{ alignSelf: "center" }}>
                            Page {page} of {pages}
                        </span>
                        <Link className="cd-btn cd-btn-sm cd-btn-outline" href={href({ page: page + 1 })} aria-disabled={page >= pages}>
                            Next →
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
