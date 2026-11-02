import { CSSProperties } from "react";
import { ExamSection } from "@/types/exam";
import { readableOn } from "@/componenets/learning/levelMeta";

/** The colour identity of a section: Mündlicher Ausdruck is Clay Rose, Schriftlicher Ausdruck is Terracotta, Leseverstehen is Sage Teal, Sprachbausteine is Dusty Plum, Hörverstehen is Harbor Blue. */
export type LessonAccent = "speaking" | "writing" | "reading" | "grammar" | "listening";

const THEMES: Record<LessonAccent, { primary: string; from: string; to: string }> = {
    speaking: { primary: "#b5637f", from: "#b5637f", to: "#d98ba3" },
    writing: { primary: "#c2674f", from: "#c2674f", to: "#d9917c" },
    listening: { primary: "#35618f", from: "#35618f", to: "#6f9fd0" },
    grammar: { primary: "#7a6a9e", from: "#7a6a9e", to: "#a597c6" },
    reading: { primary: "#16324f", from: "#16324f", to: "#35618f" },
};

/** The solid colour of an accent (hex), for tinting a panel such as the page hero. */
export function accentColor(accent: LessonAccent): string {
    return THEMES[accent].from;
}

/**
 * CSS variables of a theme. Set them on a wrapper: every `primary` colour inside follows the section, and
 * `from-(--lesson-from) to-(--lesson-to)` draws the section's gradient.
 */
export function lessonThemeVars(accent: LessonAccent): CSSProperties {
    const t = THEMES[accent];
    return { "--primary": t.primary, "--primary-foreground": readableOn(t.primary), "--lesson-from": t.from, "--lesson-to": t.to } as CSSProperties;
}

/** Sections that use the redesigned Teil list / Teil page / exercise header, with their colour and decoration. */
export const SECTION_THEME: Partial<Record<ExamSection, { accent: LessonAccent; emoji: string }>> = {
    LESEVERSTEHEN: { accent: "reading", emoji: "📖" },
    SPRACHBAUSTEINE: { accent: "grammar", emoji: "🧩" },
    HOERVERSTEHEN: { accent: "listening", emoji: "🎧" },
};

/** The accent of any exam section, including the writing and speaking pages that are themed outside SECTION_THEME. */
export function accentForSection(section: ExamSection): LessonAccent | null {
    if (section === "SCHRIFTLICHER_AUSDRUCK") return "writing";
    if (section === "MUENDLICHER_AUSDRUCK") return "speaking";
    return SECTION_THEME[section]?.accent ?? null;
}

/** Style for a toast opened from a section's page: its icon, border and accent follow the section's colour. */
export function toastThemeStyle(accent: LessonAccent | null): CSSProperties | undefined {
    if (!accent) return undefined;
    const t = THEMES[accent];
    return {
        "--toastify-color-info": t.primary,
        "--toastify-color-success": t.primary,
        "--toastify-icon-color-info": t.primary,
        "--toastify-icon-color-success": t.primary,
        borderColor: `color-mix(in srgb, ${t.from} 45%, transparent)`,
        borderInlineStartWidth: 5,
        borderInlineStartColor: t.from,
    } as CSSProperties;
}
