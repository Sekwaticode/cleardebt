"use client";

import { useState } from "react";

/* Single-series column chart: submissions per day, last 30 days.
   Thin columns with 4px rounded data-ends, hairline grid, hover
   tooltip on a full-height hit target, and a visually-hidden table
   for screen readers. */

const W = 720;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 32 };
const SERIES = "#2a78d6";
const GRID = "#e4e7ee";
const AXIS_TEXT = "#6b7385";

function niceMax(max: number) {
    if (max <= 4) return 4;
    const pow = 10 ** Math.floor(Math.log10(max));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => max / s <= 4) ?? pow * 10;
    return Math.ceil(max / step) * step;
}

function columnPath(x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h);
    return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", opts);

export default function DailyChart({ data }: { data: { date: string; count: number }[] }) {
    const [hover, setHover] = useState<number | null>(null);
    const max = niceMax(Math.max(0, ...data.map((d) => d.count)));
    const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const slot = innerW / Math.max(1, data.length);
    const barW = Math.min(24, slot - 2);
    const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

    const hovered = hover !== null ? data[hover] : null;

    return (
        <div className="cd-chart" onMouseLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Submissions per day over the last 30 days">
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                        <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
                            {Number.isInteger(t) ? t.toLocaleString("en-ZA") : ""}
                        </text>
                    </g>
                ))}
                {data.map((d, i) => {
                    const cx = PAD.left + slot * i + slot / 2;
                    const h = (d.count / max) * innerH;
                    const showLabel = i % 7 === 0 || i === data.length - 1;
                    return (
                        <g key={d.date}>
                            {d.count > 0 && (
                                <path
                                    d={columnPath(cx - barW / 2, y(d.count), barW, h, 4)}
                                    fill={SERIES}
                                    opacity={hover === null || hover === i ? 1 : 0.45}
                                />
                            )}
                            {showLabel && (
                                <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                                    {fmtDay(d.date, { day: "numeric", month: "short" })}
                                </text>
                            )}
                            <rect
                                x={PAD.left + slot * i}
                                y={PAD.top}
                                width={slot}
                                height={innerH}
                                fill="transparent"
                                onMouseEnter={() => setHover(i)}
                                onFocus={() => setHover(i)}
                                onBlur={() => setHover(null)}
                                tabIndex={0}
                                aria-label={`${fmtDay(d.date, { day: "numeric", month: "long" })}: ${d.count} submissions`}
                            />
                        </g>
                    );
                })}
            </svg>
            {hovered && hover !== null && (
                <div
                    className="cd-chart-tip"
                    style={{
                        left: `${((PAD.left + slot * hover + slot / 2) / W) * 100}%`,
                        top: `${(y(hovered.count) / H) * 100}%`,
                    }}
                >
                    <strong>
                        {hovered.count} submission{hovered.count === 1 ? "" : "s"}
                    </strong>
                    {fmtDay(hovered.date, { weekday: "short", day: "numeric", month: "short" })}
                </div>
            )}
            <table className="sr-only">
                <caption>Submissions per day</caption>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.date}>
                            <th scope="row">{d.date}</th>
                            <td>{d.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
