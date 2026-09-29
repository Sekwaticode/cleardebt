"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FORM_DEFINITIONS, STATUSES, STATUS_LABELS } from "@/lib/forms/definitions";

export interface Filters {
    q: string;
    type: string;
    status: string;
    from: string;
    to: string;
    pdf: string;
    sort: string;
    dir: string;
}

/** Filter controls that live in the URL, so filtered views can be bookmarked/shared. */
export default function FilterBar({ current }: { current: Filters }) {
    const router = useRouter();
    const pathname = usePathname();
    const [q, setQ] = useState(current.q);
    const first = useRef(true);

    const apply = (patch: Partial<Filters>) => {
        const next = { ...current, ...patch };
        const params = new URLSearchParams();
        Object.entries(next).forEach(([k, v]) => {
            if (v) params.set(k, v);
        });
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
    };

    // Debounced search; resets to page 1 because `page` isn't carried over.
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => apply({ q: q.trim() }), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const hasFilters = Boolean(current.q || current.type || current.status || current.from || current.to || current.pdf);

    return (
        <div className="cd-filters" role="search">
            <div className="cd-field cd-search">
                <label htmlFor="f-q">Search</label>
                <input id="f-q" className="cd-input" type="search" placeholder="Name, surname, email, phone, ID, reference or form…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="cd-field">
                <label htmlFor="f-type">Form type</label>
                <select id="f-type" className="cd-select" value={current.type} onChange={(e) => apply({ type: e.target.value })}>
                    <option value="">All forms</option>
                    {FORM_DEFINITIONS.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.title}
                        </option>
                    ))}
                </select>
            </div>
            <div className="cd-field">
                <label htmlFor="f-status">Status</label>
                <select id="f-status" className="cd-select" value={current.status} onChange={(e) => apply({ status: e.target.value })}>
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>
            </div>
            <div className="cd-field">
                <label htmlFor="f-from">Created from</label>
                <input id="f-from" className="cd-input" type="date" value={current.from} max={current.to || undefined} onChange={(e) => apply({ from: e.target.value })} />
            </div>
            <div className="cd-field">
                <label htmlFor="f-to">Created to</label>
                <input id="f-to" className="cd-input" type="date" value={current.to} min={current.from || undefined} onChange={(e) => apply({ to: e.target.value })} />
            </div>
            <div className="cd-field">
                <label htmlFor="f-pdf">PDF</label>
                <select id="f-pdf" className="cd-select" value={current.pdf} onChange={(e) => apply({ pdf: e.target.value })}>
                    <option value="">Any</option>
                    <option value="issues">Missing / failed</option>
                </select>
            </div>
            {hasFilters && (
                <button
                    type="button"
                    className="cd-btn cd-btn-sm cd-btn-ghost"
                    style={{ gridColumn: "1 / -1", justifySelf: "end" }}
                    onClick={() => {
                        setQ("");
                        router.replace(pathname);
                    }}
                >
                    Clear all filters
                </button>
            )}
        </div>
    );
}
