import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { formatDateTime } from "@/lib/forms/definitions";
import { SECTIONS, SECTION_GROUPS } from "@/lib/cms/sections";

export const dynamic = "force-dynamic";

const GROUP_HELP: Record<(typeof SECTION_GROUPS)[number], string> = {
    Sections: "Page sections, in the order they appear on the home page.",
    Components: "Reusable components that live inside the sections.",
    Navigation: "The site-wide menu and footer.",
};

export default async function ContentPage() {
    const { supabase } = await requireAdminPage("/admin/content");

    const { data, error } = await supabase.from("site_content").select("section, updated_at, updated_by");
    const rows = new Map((data ?? []).map((r) => [r.section as string, r as { section: string; updated_at: string; updated_by: string | null }]));

    const editorIds = Array.from(new Set(Array.from(rows.values()).map((r) => r.updated_by).filter((v): v is string => !!v)));
    const { data: people } = editorIds.length
        ? await supabase.from("profiles").select("id, email, full_name").in("id", editorIds)
        : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
    const who = (id: string | null) => {
        const p = people?.find((x) => x.id === id);
        return p ? p.full_name || p.email : null;
    };

    const customised = SECTIONS.filter((s) => rows.has(s.key)).length;

    return (
        <>
            <div className="cd-admin-head">
                <div>
                    <h1>Website content</h1>
                    <p>Edit the texts, links, images and videos on the public website. Layout, colours and styling are fixed by design.</p>
                </div>
                <div className="cd-actions">
                    <Link className="cd-btn cd-btn-outline" href="/admin/media">
                        Media library
                    </Link>
                    <a className="cd-btn cd-btn-outline" href="/" target="_blank" rel="noopener">
                        View website ↗
                    </a>
                </div>
            </div>

            {error && (
                <div className="cd-alert cd-alert-error">
                    The content table couldn&apos;t be read ({error.message}). Has the migration <code>20261002120000_site_cms.sql</code> been run?
                </div>
            )}

            <div className="cd-kpis cd-kpis-3">
                <div className="cd-kpi">
                    <div className="cd-kpi-label">Editable sections</div>
                    <div className="cd-kpi-value">{SECTIONS.length}</div>
                </div>
                <div className="cd-kpi">
                    <div className="cd-kpi-label">Customised</div>
                    <div className="cd-kpi-value">{customised}</div>
                </div>
                <div className="cd-kpi">
                    <div className="cd-kpi-label">Using built-in content</div>
                    <div className="cd-kpi-value">{SECTIONS.length - customised}</div>
                </div>
            </div>

            {SECTION_GROUPS.map((group) => (
                <section className="cd-card" key={group}>
                    <div className="cd-card-header">
                        <div>
                            <h2>{group}</h2>
                            <p>{GROUP_HELP[group]}</p>
                        </div>
                    </div>
                    <ul className="cd-cms-sections" role="list">
                        {SECTIONS.filter((s) => s.group === group).map((s) => {
                            const row = rows.get(s.key);
                            return (
                                <li key={s.key}>
                                    <Link href={`/admin/content/${s.key}`} className="cd-cms-section-link">
                                        <div className="cd-cms-section-main">
                                            <strong>{s.name}</strong>
                                            <span className="cd-muted">{s.description}</span>
                                            <span className="cd-cms-section-pages">
                                                {s.usedOn.length ? (
                                                    s.usedOn.map((p) => (
                                                        <span key={p.href} className="cd-chip">
                                                            {p.label}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="cd-chip cd-chip-warn">Not on any page yet</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="cd-cms-section-state">
                                            {row ? (
                                                <>
                                                    <span className="cd-chip cd-chip-ok">Customised</span>
                                                    <small className="cd-muted">
                                                        {formatDateTime(row.updated_at)}
                                                        {who(row.updated_by) ? ` · ${who(row.updated_by)}` : ""}
                                                    </small>
                                                </>
                                            ) : (
                                                <span className="cd-chip">Default</span>
                                            )}
                                        </div>
                                        <span className="cd-cms-arrow" aria-hidden>
                                            ›
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </>
    );
}
