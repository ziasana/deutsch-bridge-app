import { Bot, BookOpen, ClipboardCheck, Layers, MessagesSquare, Newspaper, Timer, TrendingUp, LucideIcon } from "lucide-react";

/** Icons for the feature ids used in the marketing copy (nav.learnItems and features.items). */
export const FEATURE_ICONS: Record<string, LucideIcon> = {
    "exam-practice": ClipboardCheck,
    "mock-exam": Timer,
    "ai-tutor": Bot,
    grammar: BookOpen,
    vocabulary: Layers,
    redemittel: MessagesSquare,
    reading: Newspaper,
    progress: TrendingUp,
};
