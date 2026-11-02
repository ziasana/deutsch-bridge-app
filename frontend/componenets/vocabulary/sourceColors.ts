import { VocabularyMasteryLevel, VocabularySource } from "@/types/vocabulary";

// Hover border accent per word source, shared between VocabularyCard and
// VocabularySourceSelector so both use the same source identity color.
export const SOURCE_HOVER_BORDER: Record<VocabularySource, string> = {
    CUSTOM: "hover:border-primary/40",
    DICTIONARY: "hover:border-[#c98a12]/40",
    AI_TUTOR: "hover:border-vocabulary-ai/40",
};

// Matching faint background tint, used where the hover should also fill the
// card (e.g. VocabularySourceSelector), not just outline it.
export const SOURCE_HOVER_BG: Record<VocabularySource, string> = {
    CUSTOM: "hover:bg-primary/[0.06]",
    DICTIONARY: "hover:bg-[#c98a12]/[0.06]",
    AI_TUTOR: "hover:bg-vocabulary-ai/[0.06]",
};

/** One colour per word source: My words Deep Navy, From Reading Honey (the darker Warm Amber), AI Tutor Dusty Plum. */
export const SOURCE_ACCENT: Record<VocabularySource, string> = {
    CUSTOM: "#16324f",
    DICTIONARY: "#c98a12",
    AI_TUTOR: "#7a6a9e",
};

/** Chip colours of the mastery levels shown on the word cards. */
export const MASTERY_CHIP: Record<VocabularyMasteryLevel, string> = {
    NEW: "bg-foreground/[0.08] text-foreground/65",
    LEARNING: "bg-brand-blue/15 text-blue-700 dark:text-blue-300",
    FAMILIAR: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    MASTERED: "bg-brand-slate/15 text-brand-slate",
};

/** Colour of the German article (der / die / das), as in the Reading section. */
export const ARTICLE_TONE: Record<string, string> = {
    der: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
    die: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    das: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
};
