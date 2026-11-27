"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiTrendingUp } from "react-icons/fi";
import { DonutChart, type DonutChartSegment } from "@/components/ui/donut-chart";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_CONTENT, type CreditScoreProfileContent } from "@/lib/cms/defaults";

// Chart colours are part of the design, assigned to factors by position (not editable in the CMS).
const FACTOR_COLORS = ["#a78bfa", "#f472b6", "#34d399", "#38bdf8", "#fbbf24"];

// Illustrative client profile after working with ClearDebt
export default function CreditScoreProfile({ content = DEFAULT_CONTENT.creditScoreProfile }: { content?: CreditScoreProfileContent }) {
    const SCORE_BEFORE = content.scoreBefore;
    const SCORE_AFTER = content.scoreAfter;
    const SCORE_MAX = content.scoreMax;
    const creditFactors = content.factors.map((f, i) => ({ ...f, color: FACTOR_COLORS[i % FACTOR_COLORS.length] }));
    const milestones = content.milestones.map((m) => m.text);

    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

    const handleSegmentHover = useCallback(
        (segment: DonutChartSegment | null) => setHoveredLabel(segment?.label ?? null),
        []
    );

    const activeFactor = creditFactors.find((f) => f.label === hoveredLabel);
    const scoreGain = SCORE_AFTER - SCORE_BEFORE;

    return (
        <Card className="relative w-full mx-auto flex flex-col items-center space-y-6 overflow-hidden p-6 md:p-8 rounded-3xl border-purple-200 bg-white/75 text-neutral-900 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(168,85,247,0.15),0_40px_100px_-30px_rgba(124,58,237,0.45)]">
            {/* Glass sheen */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 via-transparent to-purple-500/[0.06]" />
            <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-fuchsia-300/30 blur-3xl" />

            <div className="relative flex w-full items-center justify-between">
                <div>
                    <p className="text-sm text-neutral-500">{content.subtitle}</p>
                    <h2 className="text-xl font-semibold tracking-tight">{content.title}</h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <FiTrendingUp />
                    {scoreGain >= 0 ? "+" : ""}
                    {scoreGain} pts
                </span>
            </div>

            <div className="relative grid w-full items-center gap-6 md:grid-cols-[auto_1fr]">
            <DonutChart
                data={creditFactors}
                size={220}
                strokeWidth={24}
                className="mx-auto"
                animationDuration={1.2}
                animationDelayPerSegment={0.05}
                activeLabel={hoveredLabel}
                onSegmentHover={handleSegmentHover}
                trackColor="rgba(0, 0, 0, 0.06)"
                centerContent={
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeFactor?.label ?? "score"}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, ease: "circOut" }}
                            className="flex flex-col items-center justify-center text-center"
                        >
                            {activeFactor ? (
                                <>
                                    <p className="text-sm font-medium text-neutral-500 max-w-[140px] truncate">
                                        {activeFactor.label}
                                    </p>
                                    <p className="text-4xl font-bold">{activeFactor.value}%</p>
                                    <p className="text-sm font-medium" style={{ color: activeFactor.color }}>
                                        {activeFactor.rating}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-neutral-500">{content.scoreLabel}</p>
                                    <p className="text-5xl font-bold">{SCORE_AFTER}</p>
                                    <p className="text-sm text-neutral-500">
                                        was <span className="line-through">{SCORE_BEFORE}</span> · /{SCORE_MAX}
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                }
            />

            <div className="flex w-full flex-col space-y-1 rounded-2xl border border-neutral-200 bg-white/60 p-2">
                {creditFactors.map((factor, index) => (
                    <motion.div
                        key={factor.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
                        className={cn(
                            "flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors duration-200",
                            hoveredLabel === factor.label && "bg-purple-50"
                        )}
                        onMouseEnter={() => setHoveredLabel(factor.label)}
                        onMouseLeave={() => setHoveredLabel(null)}
                    >
                        <div className="flex items-center space-x-3">
                            <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: factor.color }}
                            />
                            <span className="text-sm font-medium">{factor.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-neutral-500">{factor.rating}</span>
                    </motion.div>
                ))}
            </div>
            </div>

            <div className="relative flex w-full flex-wrap justify-center gap-2 border-t border-neutral-200 pt-4">
                {milestones.map((m, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs text-neutral-600"
                    >
                        <FiCheckCircle className="text-emerald-600" />
                        {m}
                    </span>
                ))}
            </div>

        </Card>
    );
}
