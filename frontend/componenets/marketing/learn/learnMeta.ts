import { BookOpen, LucideIcon, MessagesSquare, Newspaper, Sparkles } from "lucide-react";
import type { PublicOverview } from "@/types/publicLearn";

export type LearnKind = "grammar" | "redemittel" | "expressions" | "reading";

export const LEARN_KINDS: LearnKind[] = ["grammar", "redemittel", "expressions", "reading"];

export const LEARN_META: Record<LearnKind, { icon: LucideIcon; color: string; href: string }> = {
    grammar: { icon: BookOpen, color: "#35618f", href: "/learn/grammar" },
    redemittel: { icon: MessagesSquare, color: "#4f9d96", href: "/learn/redemittel" },
    expressions: { icon: Sparkles, color: "#c98a12", href: "/learn/expressions" },
    reading: { icon: Newspaper, color: "#4f9d96", href: "/learn/reading" },
};

export const totalOf = (overview: PublicOverview, kind: LearnKind) => overview[kind].reduce((sum, l) => sum + l.total, 0);
export const freeOf = (overview: PublicOverview, kind: LearnKind) => overview[kind].reduce((sum, l) => sum + l.free, 0);
