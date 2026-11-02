import { LucideIcon, Brain, Sparkles } from "lucide-react";
import { ExamIcon, GrammarIcon, ReadingIcon, VocabularyIcon } from "@/componenets/brand/icons";

export type ActivityType = "DAILY_WORDS" | "VOCAB_REVIEW" | "GRAMMAR" | "READING" | "EXPRESSIONS" | "EXAM";

interface ActivityMeta {
    icon: LucideIcon;
    iconClass: string;
    bgClass: string;
}

// Centralized icon + semantic color per learning category, so every dashboard
// card that references an activity type stays visually consistent.
export const ACTIVITY_CONFIG: Record<ActivityType, ActivityMeta> = {
    DAILY_WORDS: { icon: VocabularyIcon, iconClass: "text-learning-vocabulary", bgClass: "bg-learning-vocabulary/12" },
    VOCAB_REVIEW: { icon: Brain, iconClass: "text-learning-review", bgClass: "bg-learning-review/12" },
    GRAMMAR: { icon: GrammarIcon, iconClass: "text-learning-grammar", bgClass: "bg-learning-grammar/12" },
    READING: { icon: ReadingIcon, iconClass: "text-learning-reading", bgClass: "bg-learning-reading/12" },
    EXPRESSIONS: { icon: Sparkles, iconClass: "text-learning-expression", bgClass: "bg-learning-expression/12" },
    EXAM: { icon: ExamIcon, iconClass: "text-learning-exam", bgClass: "bg-learning-exam/12" },
};
