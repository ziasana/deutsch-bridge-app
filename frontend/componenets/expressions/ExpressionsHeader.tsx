"use client";

import { ArrowRight, Play, Sparkles } from "lucide-react";
import CurrentLevelChip from "@/componenets/learning/CurrentLevelChip";
import { ExpressionMasteryLevel, ExpressionType } from "@/types/expression";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { ExpressionCollectionOption } from "./ExpressionCollectionSelector";
import { COLLECTION_ACCENT } from "./expressionMeta";
import HeroCollectionFilter from "@/componenets/learning/HeroCollectionFilter";
import MasteryBar from "@/componenets/learning/MasteryBar";

const MASTERY_COLOR: Record<ExpressionMasteryLevel, string> = {
    NEW: "color-mix(in srgb, var(--foreground) 30%, transparent)",
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
    onPractice: () => void;
    /** The collections (Nomen-Verb-Verbindungen, Redewendungen), shown as the header's filter. */
    collections: ExpressionCollectionOption[];
    collection: ExpressionType;
    onCollection: (type: ExpressionType) => void;
}

/** The expressions header: the shared navy learning header with the collection filter, the Practice action and the mastery bar. */
export default function ExpressionsHeader({ counts, onPractice, collections, collection, onCollection }: Readonly<ExpressionsHeaderProps>) {
    return (
        <LearningPageHero
            icon={Sparkles}
            title="Active Expressions"
            subtitle="Learn useful expressions, understand them in context, and use them yourself."
            meta={<CurrentLevelChip />}
            accent={COLLECTION_ACCENT[collection]}
            actions={
                <button
                    type="button"
                    onClick={onPractice}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f2b544] px-5 py-2 text-sm font-semibold text-[#16324f] shadow-sm transition hover:bg-[#f5c26b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <Play className="size-3.5 fill-current" aria-hidden="true" />
                    Practice
                    <ArrowRight className="size-4" aria-hidden="true" />
                </button>
            }
        >
            <HeroCollectionFilter
                ariaLabel="Expression collection"
                options={collections.map((c) => ({ key: c.type, label: c.label, count: c.count, icon: c.icon, color: COLLECTION_ACCENT[c.type] }))}
                selected={collection}
                onSelect={onCollection}
            />
            {counts && <MasteryBar slim className="mt-4" segments={ORDER.map((l) => ({ key: l, label: MASTERY_LABEL[l], count: counts[l], color: MASTERY_COLOR[l] }))} />}
        </LearningPageHero>
    );
}
