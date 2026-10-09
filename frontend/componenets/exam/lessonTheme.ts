import { CSSProperties } from "react";
import { ExamSection } from "@/types/exam";

/** The colour identity of a section: Mündlicher Ausdruck is pink, Schriftlicher Ausdruck is orange, Leseverstehen is teal, Sprachbausteine is violet, Hörverstehen is green. */
export type LessonAccent = "speaking" | "writing" | "reading" | "grammar" | "listening";

const THEMES: Record<LessonAccent, { primary: string; from: string; to: string }> = {
    speaking: { primary: "hsl(330 81% 60%)", from: "#ec4899", to: "#fb923c" },
    writing: { primary: "hsl(25 95% 53%)", from: "#f97316", to: "#f59e0b" },
    listening: { primary: "hsl(161 94% 30%)", from: "#059669", to: "#4ade80" },
    grammar: { primary: "hsl(262 83% 58%)", from: "#7c3aed", to: "#c084fc" },
    reading: { primary: "hsl(175 84% 32%)", from: "#0d9488", to: "#22d3ee" },
};

/**
 * CSS variables of a theme. Set them on a wrapper: every `primary` colour inside follows the section, and
 * `from-(--lesson-from) to-(--lesson-to)` draws the section's gradient.
 */
export function lessonThemeVars(accent: LessonAccent): CSSProperties {
    const t = THEMES[accent];
    return { "--primary": t.primary, "--primary-foreground": "hsl(0 0% 100%)", "--lesson-from": t.from, "--lesson-to": t.to } as CSSProperties;
}

/** Sections that use the redesigned Teil list / Teil page / exercise header, with their colour and decoration. */
export const SECTION_THEME: Partial<Record<ExamSection, { accent: LessonAccent; emoji: string }>> = {
    LESEVERSTEHEN: { accent: "reading", emoji: "📖" },
    SPRACHBAUSTEINE: { accent: "grammar", emoji: "🧩" },
    HOERVERSTEHEN: { accent: "listening", emoji: "🎧" },
};
