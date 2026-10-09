"use client";

import { ArrowRight, Play, Sparkles } from "lucide-react";
import CurrentLevelChip from "@/componenets/learning/CurrentLevelChip";
import { ExpressionMasteryLevel } from "@/types/expression";
import RisingBubbles from "@/componenets/learning/RisingBubbles";
import RisingWords from "@/componenets/learning/RisingWords";
import MasteryBar from "@/componenets/learning/MasteryBar";
import { ACCENT_TITLE_COLOR } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

const MASTERY_COLOR: Record<ExpressionMasteryLevel, string> = {
    NEW: "color-mix(in srgb, var(--foreground) 25%, transparent)",
    LEARNING: "var(--chart-1)",
    FAMILIAR: "var(--chart-4)",
    ACTIVE: "var(--chart-2)",
    MASTERED: "var(--chart-3)",
};

const MASTERY_LABEL: Record<ExpressionMasteryLevel, string> = {
    NEW: "New",
    LEARNING: "Learning",
    FAMILIAR: "Familiar",
    ACTIVE: "Active",
    MASTERED: "Mastered",
};

const ORDER: ExpressionMasteryLevel[] = ["MASTERED", "ACTIVE", "FAMILIAR", "LEARNING", "NEW"];

interface ExpressionsHeaderProps {
    /** Expressions per mastery level in the selected collection; null while still loading. */
    counts: Record<ExpressionMasteryLevel, number> | null;
    /** Expressions from your list; each one floats in the header as a speech bubble. */
    words: string[];
    onPractice: () => void;
    /** Tints the hero softly in the colour of the selected collection. */
    accent?: string;
}

/** The vocabulary page's header, for expressions: title and action, floating expressions, rising bubbles and a mastery bar. */
export default function ExpressionsHeader({ counts, words, onPractice, accent }: Readonly<ExpressionsHeaderProps>) {
    return (
        <header
            className={cn("relative overflow-hidden rounded-3xl border p-5 transition-colors duration-300 sm:p-6", accent ? "border-primary/40 bg-card" : "border-primary/10 bg-gradient-to-br from-primary/[0.03] via-card to-card")}
            // Re-pointing --primary makes the icon tile, chip, button and bubbles take the accent colour.
            style={accent ? ({ "--primary": accent, "--primary-foreground": "#ffffff", backgroundImage: `linear-gradient(135deg, ${accent}52, ${accent}1f 60%, ${accent}0d)` } as React.CSSProperties) : undefined}
        >
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/[0.06]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-1/4 size-36 rounded-full bg-primary/[0.04]" />
            <RisingBubbles count={Math.max(6, words.length * 2)} />
            <RisingWords words={words} />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex w-full min-w-0 items-center gap-3.5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <Sparkles className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold text-foreground sm:text-2xl" style={accent ? { color: ACCENT_TITLE_COLOR } : undefined}>Active Expressions</h1>
                            <CurrentLevelChip />
                        </div>
                        <p className="text-sm text-foreground/60">Learn useful expressions, understand them in context, and use them yourself.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onPractice}
                    className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <Play className="size-3 fill-current" aria-hidden="true" />
                    Practice
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
            </div>

            {counts && <MasteryBar slim className="mt-4" segments={ORDER.map((l) => ({ key: l, label: MASTERY_LABEL[l], count: counts[l], color: MASTERY_COLOR[l] }))} />}
        </header>
    );
}
