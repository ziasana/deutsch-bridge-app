import { LucideIcon, Sprout, Leaf, BookOpen, GraduationCap, Star, Trophy } from "lucide-react";

export interface LevelMeta {
    icon: LucideIcon;
    color: string;
}

export const LEVEL_META: Record<string, LevelMeta> = {
    A1: { icon: Sprout, color: "#22c55e" },
    A2: { icon: Leaf, color: "#3b82f6" },
    B1: { icon: BookOpen, color: "#8b5cf6" },
    B2: { icon: GraduationCap, color: "#6366f1" },
    C1: { icon: Star, color: "#f59e0b" },
    C2: { icon: Trophy, color: "#f43f5e" },
};

export const FALLBACK_LEVEL_META: LevelMeta = { icon: BookOpen, color: "#6b7280" };

export function getLevelMeta(level: string): LevelMeta {
    return LEVEL_META[level] ?? FALLBACK_LEVEL_META;
}
