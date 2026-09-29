import Link from "next/link";

/* Horizontal bar list — label, count and share on one line, bar below.
   Text always stays in text colours; the colour lives only in the
   swatch and the bar, so identity never depends on colour alone. */

export interface BarItem {
    key: string;
    label: string;
    value: number;
    color?: string;
    href?: string;
}

export default function BarList({ items, total }: { items: BarItem[]; total?: number }) {
    const max = Math.max(1, ...items.map((i) => i.value));
    const sum = total ?? items.reduce((s, i) => s + i.value, 0);
    return (
        <div className="cd-barlist">
            {items.map((item) => {
                const pct = sum ? Math.round((item.value / sum) * 100) : 0;
                const label = (
                    <span>
                        {item.color && <span className="cd-swatch" style={{ background: item.color }} aria-hidden />}
                        {item.label}
                    </span>
                );
                return (
                    <div className="cd-barlist-row" key={item.key} title={`${item.label}: ${item.value} (${pct}%)`}>
                        <div className="cd-barlist-top">
                            {item.href ? <Link href={item.href}>{label}</Link> : label}
                            <span>
                                <strong>{item.value.toLocaleString("en-ZA")}</strong>
                                <span className="cd-muted"> · {pct}%</span>
                            </span>
                        </div>
                        <div className="cd-barlist-track">
                            {item.value > 0 && <div className="cd-barlist-fill" style={{ width: `${(item.value / max) * 100}%`, background: item.color }} />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
