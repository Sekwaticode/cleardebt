import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { formatDateTime } from "@/lib/forms/definitions";
import { DEFAULT_CONTENT } from "@/lib/cms/defaults";
import { getSectionDef } from "@/lib/cms/sections";
import { mergeWithDefaults } from "@/lib/cms/validate";
import SectionEditor from "@/components/admin/cms/SectionEditor";
import RevisionHistory, { type RevisionItem } from "@/components/admin/cms/RevisionHistory";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 25;

export default async function SectionPage({ params }: { params: { section: string } }) {
    const def = getSectionDef(params.section);
    if (!def) notFound();
    const { supabase } = await requireAdminPage(`/admin/content/${def.key}`);

    const [rowRes, revRes] = await Promise.all([
        supabase.from("site_content").select("content, updated_at, updated_by").eq("section", def.key).maybeSingle(),
        supabase
            .from("site_content_revisions")
            .select("id, action, created_at, created_by")
            .eq("section", def.key)
            .order("id", { ascending: false })
            .limit(HISTORY_LIMIT),
    ]);
    if (rowRes.error) throw rowRes.error;
    const row = rowRes.data as { content: unknown; updated_at: string; updated_by: string | null } | null;
    const revs = (revRes.data ?? []) as { id: number; action: RevisionItem["action"]; created_at: string; created_by: string | null }[];

    const ids = Array.from(new Set([row?.updated_by, ...revs.map((r) => r.created_by)].filter((v): v is string => !!v)));
    const { data: people } = ids.length
        ? await supabase.from("profiles").select("id, email, full_name").in("id", ids)
        : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
    const who = (id: string | null | undefined) => {
        const p = people?.find((x) => x.id === id);
        return p ? p.full_name || p.email || "Admin" : "Unknown user";
    };

    const defaults = DEFAULT_CONTENT[def.key] as Record<string, unknown>;
    const content = row ? mergeWithDefaults(def.fields, row.content, defaults) : defaults;
    const revisions: RevisionItem[] = revs.map((r, i) => ({
        id: r.id,
        action: r.action,
        when: formatDateTime(r.created_at),
        who: who(r.created_by),
        isCurrent: i === 0,
    }));

    return (
        <>
            <div className="cd-admin-head">
                <div>
                    <nav className="cd-breadcrumb" aria-label="Breadcrumb">
                        <Link href="/admin/content">Website content</Link> / {def.name}
                    </nav>
                    <h1 style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {def.name}
                        <span className={`cd-chip${row ? " cd-chip-ok" : ""}`}>{row ? "Customised" : "Default"}</span>
                    </h1>
                    <p>{def.description}</p>
                </div>
                {def.usedOn.length > 0 && (
                    <div className="cd-actions">
                        {def.usedOn.map((p) => (
                            <a key={p.href} className="cd-btn cd-btn-sm cd-btn-outline" href={p.href} target="_blank" rel="noopener">
                                View on {p.label} ↗
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <div className="cd-detail-layout">
                <div>
                    <SectionEditor sectionKey={def.key} initial={content} customised={!!row} version={String(revs[0]?.id ?? "none")} />
                </div>
                <div>
                    <section className="cd-card">
                        <div className="cd-card-header">
                            <h2>Details</h2>
                        </div>
                        <div className="cd-card-body">
                            <dl className="cd-meta-list">
                                <div>
                                    <dt>Status</dt>
                                    <dd>{row ? "Customised" : "Built-in content"}</dd>
                                </div>
                                <div>
                                    <dt>Last published</dt>
                                    <dd>{row ? `${formatDateTime(row.updated_at)} · ${who(row.updated_by)}` : "—"}</dd>
                                </div>
                                <div>
                                    <dt>Appears on</dt>
                                    <dd>{def.usedOn.length ? def.usedOn.map((p) => p.label).join(", ") : "Not placed on a page yet"}</dd>
                                </div>
                                <div>
                                    <dt>Component</dt>
                                    <dd>
                                        <code style={{ fontSize: 12 }}>{def.file}</code>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </section>
                    <section className="cd-card">
                        <div className="cd-card-header">
                            <div>
                                <h2>History</h2>
                                <p>The latest {HISTORY_LIMIT} changes. You can restore any earlier version.</p>
                            </div>
                        </div>
                        <div className="cd-card-body">
                            <RevisionHistory sectionKey={def.key} revisions={revisions} />
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
