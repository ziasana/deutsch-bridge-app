import { VocabularySource } from "@/types/vocabulary";

// Hover border accent per word source, shared between VocabularyCard and
// VocabularySourceSelector so both use the same source identity color.
export const SOURCE_HOVER_BORDER: Record<VocabularySource, string> = {
    CUSTOM: "hover:border-primary/40",
    DICTIONARY: "hover:border-learning-reading/40",
    AI_TUTOR: "hover:border-vocabulary-ai/40",
};

// Matching faint background tint, used where the hover should also fill the
// card (e.g. VocabularySourceSelector), not just outline it.
export const SOURCE_HOVER_BG: Record<VocabularySource, string> = {
    CUSTOM: "hover:bg-primary/[0.06]",
    DICTIONARY: "hover:bg-learning-reading/[0.06]",
    AI_TUTOR: "hover:bg-vocabulary-ai/[0.06]",
};
