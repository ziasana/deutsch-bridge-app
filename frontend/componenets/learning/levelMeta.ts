import type { CSSProperties } from "react";
import { LucideIcon, Sprout, Leaf, BookOpen, GraduationCap, Star, Trophy } from "lucide-react";

export interface LevelMeta {
    icon: LucideIcon;
    color: string;
}

/**
 * Level colours stay inside the brand palette and deepen with the level: A1 Sage Teal, A2 Bright Blue, then the navy
 * family for B1 and B2 (a lighter step of Deep Navy, so it still reads on the dark theme).
 */
export const LEVEL_META: Record<string, LevelMeta> = {
    A1: { icon: Sprout, color: "#4f9d96" },
    A2: { icon: Leaf, color: "#3d8bff" },
    B1: { icon: BookOpen, color: "#35618f" },
    B2: { icon: GraduationCap, color: "#254969" },
    C1: { icon: Star, color: "#c98a12" },
    C2: { icon: Trophy, color: "#b5637f" },
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
    return { "--primary": color, "--primary-foreground": readableOn(color) } as CSSProperties;
}

function luminance(hex: string): number {
    const v = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => {
        const c = parseInt(v.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Text colour for a solid accent fill: white, or Deep Navy on light accents (amber, honey) where white would be faint. */
export function readableOn(color: string): string {
    return 1.05 / (luminance(color) + 0.05) < 2.95 ? "#16324f" : "#ffffff";
}

/** Title colour for a level-themed page: the level colour, pulled toward the text colour so it stays readable. */
export const ACCENT_TITLE_COLOR = "color-mix(in srgb, var(--primary) 70%, var(--foreground))";
