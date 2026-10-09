import type { CSSProperties } from "react";
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

/**
 * Theme variables for a level colour. Put them on a page wrapper and everything inside that uses the primary colour
 * (buttons, tabs, chips, links, focus rings, quiz) follows the selected level.
 */
export function levelThemeVars(color: string): CSSProperties {
    return { "--primary": color, "--primary-foreground": "#ffffff" } as CSSProperties;
}

/** Title colour for a level-themed page: the level colour, pulled toward the text colour so it stays readable. */
export const ACCENT_TITLE_COLOR = "color-mix(in srgb, var(--primary) 70%, var(--foreground))";
