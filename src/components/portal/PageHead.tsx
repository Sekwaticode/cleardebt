import Link from "next/link";

export default function PageHead({
    crumbs,
    title,
    description,
    actions,
}: {
    crumbs?: { label: string; href?: string }[];
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="cd-page-head">
            <div>
                {crumbs && (
                    <nav className="cd-breadcrumb" aria-label="Breadcrumb">
                        {crumbs.map((c, i) => (
                            <span key={c.label}>
                                {i > 0 && " / "}
                                {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
                            </span>
                        ))}
                    </nav>
                )}
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="cd-actions">{actions}</div>}
        </div>
    );
}
