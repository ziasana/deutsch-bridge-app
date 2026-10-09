"use client";

import { ArrowRight, Library, Play, Plus } from "lucide-react";
import { VocabularyMasteryLevel } from "@/types/vocabulary";
import { useI18n } from "@/componenets/I18nProvider";
import CurrentLevelChip from "@/componenets/learning/CurrentLevelChip";
import RisingBubbles from "@/componenets/learning/RisingBubbles";
import RisingWords from "@/componenets/learning/RisingWords";
import MasteryBar from "@/componenets/learning/MasteryBar";
import { ACCENT_TITLE_COLOR } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

export const MASTERY_COLOR: Record<VocabularyMasteryLevel, string> = {
    NEW: "color-mix(in srgb, var(--foreground) 25%, transparent)",
    LEARNING: "var(--chart-1)",
    FAMILIAR: "var(--chart-4)",
    MASTERED: "var(--chart-3)",
};

const ORDER: VocabularyMasteryLevel[] = ["MASTERED", "FAMILIAR", "LEARNING", "NEW"];

export interface ShowcaseWord {
    word: string;
}

interface VocabularyHeaderProps {
    /** Words per mastery level in the selected source. */
    counts: Record<VocabularyMasteryLevel, number>;
    /** Words from your list; each one floats in the header as a speech bubble. */
    showcase: ShowcaseWord[];
    onAdd: () => void;
    onPractice: () => void;
    /** Tints the hero softly in the colour of the selected word source. */
    accent?: string;
}

/** Soft tinted header: title and actions, plus one segmented bar showing how well the shown words are known. */
export default function VocabularyHeader({ counts, showcase, onAdd, onPractice, accent }: Readonly<VocabularyHeaderProps>) {
    const { t } = useI18n();
    const words = showcase.map((w) => w.word);

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
                        <Library className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold text-foreground sm:text-2xl" style={accent ? { color: ACCENT_TITLE_COLOR } : undefined}>{t.vocabulary.title}</h1>
                            <CurrentLevelChip />
                        </div>
                        <p className="text-sm text-foreground/60">{t.vocabulary.subtitle}</p>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <Plus className="size-3.5" aria-hidden="true" />
                        {t.vocabulary.addNew}
                    </button>
                    <button
                        type="button"
                        onClick={onPractice}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <Play className="size-3 fill-current" aria-hidden="true" />
                        {t.vocabulary.practiceCta}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <MasteryBar slim className="mt-4" segments={ORDER.map((l) => ({ key: l, label: t.vocabulary.mastery[l], count: counts[l], color: MASTERY_COLOR[l] }))} />
        </header>
    );
}
