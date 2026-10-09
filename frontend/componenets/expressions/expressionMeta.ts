import { ExpressionMasteryLevel, ExpressionType } from "@/types/expression";

/** Each collection has its colour: Nomen-Verb-Verbindungen blue, Redewendungen orange (the same as their highlights in Reading). */
export const COLLECTION_ACCENT: Record<ExpressionType, string> = {
    NOMEN_VERB_VERBINDUNG: "#3b82f6",
    REDEWENDUNG: "#f97316",
};

export const MASTERY_STYLE: Record<ExpressionMasteryLevel, { label: string; chip: string }> = {
    NEW: { label: "New", chip: "bg-foreground/[0.08] text-foreground/65" },
    LEARNING: { label: "Learning", chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
    FAMILIAR: { label: "Familiar", chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
    ACTIVE: { label: "Active", chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
    MASTERED: { label: "Mastered", chip: "bg-amber-500/20 text-amber-700 dark:text-amber-300" },
};
