import { ExpressionMasteryLevel, ExpressionType } from "@/types/expression";

/** Each collection has its colour: Nomen-Verb-Verbindungen Deep Navy, Redewendungen Honey (the darker Warm Amber). */
export const COLLECTION_ACCENT: Record<ExpressionType, string> = {
    NOMEN_VERB_VERBINDUNG: "#16324f",
    REDEWENDUNG: "#c98a12",
};

export const MASTERY_STYLE: Record<ExpressionMasteryLevel, { label: string; chip: string }> = {
    NEW: { label: "New", chip: "bg-foreground/[0.08] text-foreground/65" },
    LEARNING: { label: "Learning", chip: "bg-brand-blue/15 text-blue-700 dark:text-blue-300" },
    FAMILIAR: { label: "Familiar", chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
    ACTIVE: { label: "Active", chip: "bg-brand-teal/15 text-teal-700 dark:text-teal-300" },
    MASTERED: { label: "Mastered", chip: "bg-brand-amber/25 text-amber-800 dark:text-brand-amber" },
};
