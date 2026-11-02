"use client";

import { ArrowRight, Library, Play, Plus } from "lucide-react";
import { VocabularyMasteryLevel, VocabularySource } from "@/types/vocabulary";
import { useI18n } from "@/componenets/I18nProvider";
import CurrentLevelChip from "@/componenets/learning/CurrentLevelChip";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import HeroCollectionFilter from "@/componenets/learning/HeroCollectionFilter";
import MasteryBar from "@/componenets/learning/MasteryBar";
import { VocabularySourceOption } from "./VocabularySourceSelector";
import { SOURCE_ACCENT } from "./sourceColors";

export const MASTERY_COLOR: Record<VocabularyMasteryLevel, string> = {
    NEW: "color-mix(in srgb, var(--foreground) 30%, transparent)",
    LEARNING: "var(--chart-1)",
    FAMILIAR: "var(--chart-4)",
    MASTERED: "var(--chart-3)",
};

const ORDER: VocabularyMasteryLevel[] = ["MASTERED", "FAMILIAR", "LEARNING", "NEW"];

interface VocabularyHeaderProps {
    /** Words per mastery level in the selected source. */
    counts: Record<VocabularyMasteryLevel, number>;
    /** The word sources (My words, From Reading, From AI Tutor), shown as the header's filter. */
    sources: VocabularySourceOption[];
    source: VocabularySource;
    onSource: (source: VocabularySource) => void;
    onAdd: () => void;
    onPractice: () => void;
}

/** The vocabulary header: the shared navy learning header with the source filter, the actions and one mastery bar. */
export default function VocabularyHeader({ counts, sources, source, onSource, onAdd, onPractice }: Readonly<VocabularyHeaderProps>) {
    const { t } = useI18n();

    return (
        <LearningPageHero
            icon={Library}
            title={t.vocabulary.title}
            subtitle={t.vocabulary.subtitle}
            meta={<CurrentLevelChip />}
            accent={SOURCE_ACCENT[source]}
            actions={
                <>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        {t.vocabulary.addNew}
                    </button>
                    <button
                        type="button"
                        onClick={onPractice}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f2b544] px-5 py-2 text-sm font-semibold text-[#16324f] shadow-sm transition hover:bg-[#f5c26b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <Play className="size-3.5 fill-current" aria-hidden="true" />
                        {t.vocabulary.practiceCta}
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                </>
            }
        >
            <HeroCollectionFilter
                ariaLabel="Word source"
                options={sources.map((o) => ({ key: o.source, label: o.label, count: o.count, icon: o.icon, color: SOURCE_ACCENT[o.source] }))}
                selected={source}
                onSelect={onSource}
            />
            <MasteryBar slim className="mt-4" segments={ORDER.map((l) => ({ key: l, label: t.vocabulary.mastery[l], count: counts[l], color: MASTERY_COLOR[l] }))} />
        </LearningPageHero>
    );
}
