/** Renders "before <highlight> after", with the highlight in the site's accent colour. */
export default function HighlightText({
    value,
    className = "text-fuchsia-400",
}: {
    value: { before: string; highlight: string; after: string };
    className?: string;
}) {
    const { before, highlight, after } = value;
    return (
        <>
            {before}
            {before && highlight ? " " : ""}
            {highlight && <span className={className}>{highlight}</span>}
            {after ? ` ${after}` : ""}
        </>
    );
}
