import type { ExamSlug } from "./ExamCard";

export interface TimelineBlock {
    skill: string;
    minutes: number;
    /** Indexes into the exam's `parts` copy that belong to this block (telc reads and does Sprachbausteine in one block). */
    parts: number[];
}

/** Published exam durations, approximate. Kept next to the copy so the visual and the text cannot drift apart. */
export const EXAM_TIMELINE: Record<ExamSlug, TimelineBlock[]> = {
    telc: [
        { skill: "lesen", minutes: 90, parts: [0, 1] },
        { skill: "hoeren", minutes: 30, parts: [2] },
        { skill: "schreiben", minutes: 30, parts: [3] },
        { skill: "sprechen", minutes: 15, parts: [4] },
    ],
    dtz: [
        { skill: "lesen", minutes: 60, parts: [0] },
        { skill: "hoeren", minutes: 30, parts: [1] },
        { skill: "schreiben", minutes: 30, parts: [2] },
        { skill: "sprechen", minutes: 16, parts: [3] },
    ],
};

/** The levels the explorer offers per exam; DTZ is one test whose practice is stored under B1. */
export const EXAM_LEVELS: Record<ExamSlug, { key: string; storedLevel: string; label: string }[]> = {
    telc: ["A1", "A2", "B1", "B2", "C1"].map((l) => ({ key: l, storedLevel: l, label: l })),
    dtz: [{ key: "DTZ", storedLevel: "B1", label: "A2–B1" }],
};

export const SECTION_SKILL: Record<string, string> = {
    LESEVERSTEHEN: "lesen",
    SPRACHBAUSTEINE: "sprachbausteine",
    HOERVERSTEHEN: "hoeren",
    SCHRIFTLICHER_AUSDRUCK: "schreiben",
    MUENDLICHER_AUSDRUCK: "sprechen",
};

export const SKILL_LABEL: Record<string, string> = {
    lesen: "Lesen",
    sprachbausteine: "Sprachbausteine",
    hoeren: "Hören",
    schreiben: "Schreiben",
    sprechen: "Sprechen",
};
