import { BookOpen, LucideIcon, MessagesSquare, Newspaper, Sparkles } from "lucide-react";
import type { PublicOverview } from "@/types/publicLearn";

export type LearnKind = "grammar" | "redemittel" | "expressions" | "reading";

export const LEARN_KINDS: LearnKind[] = ["grammar", "redemittel", "expressions", "reading"];

export const LEARN_META: Record<LearnKind, { icon: LucideIcon; color: string; href: string }> = {
    grammar: { icon: BookOpen, color: "#6366f1", href: "/learn/grammar" },
    redemittel: { icon: MessagesSquare, color: "#0891b2", href: "/learn/redemittel" },
    expressions: { icon: Sparkles, color: "#f59e0b", href: "/learn/expressions" },
    reading: { icon: Newspaper, color: "#10b981", href: "/learn/reading" },
};

export const totalOf = (overview: PublicOverview, kind: LearnKind) => overview[kind].reduce((sum, l) => sum + l.total, 0);
export const freeOf = (overview: PublicOverview, kind: LearnKind) => overview[kind].reduce((sum, l) => sum + l.free, 0);
