import { CSSProperties } from "react";

/** The colour identity of a section: Mündlicher Ausdruck is pink, Schriftlicher Ausdruck is orange. */
export type LessonAccent = "speaking" | "writing";

const THEMES: Record<LessonAccent, { primary: string; from: string; to: string }> = {
    speaking: { primary: "hsl(330 81% 60%)", from: "#ec4899", to: "#fb923c" },
    writing: { primary: "hsl(25 95% 53%)", from: "#f97316", to: "#f59e0b" },
};

/**
 * CSS variables of a theme. Set them on a wrapper: every `primary` colour inside follows the section, and
 * `from-(--lesson-from) to-(--lesson-to)` draws the section's gradient.
 */
export function lessonThemeVars(accent: LessonAccent): CSSProperties {
    const t = THEMES[accent];
    return { "--primary": t.primary, "--primary-foreground": "hsl(0 0% 100%)", "--lesson-from": t.from, "--lesson-to": t.to } as CSSProperties;
}
