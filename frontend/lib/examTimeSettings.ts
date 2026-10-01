import { ExamSection } from "@/types/exam";
import { ExamTimeEntry } from "@/types/examTime";

/**
 * Sections whose time is NOT part of the exam's total duration (Schriftlicher Ausdruck has its own
 * timed slot). Mirrors ExamTimeDefaults.OUTSIDE_TOTAL_DURATION on the backend, which is what enforces it.
 */
export const OUTSIDE_TOTAL_SECTIONS: readonly ExamSection[] = ["SCHRIFTLICHER_AUSDRUCK"];

export type ParsedMinutes = { kind: "blank" } | { kind: "invalid" } | { kind: "ok"; value: number };

/** Whole numbers only: "20" is fine, "20.5", "-5", "0", "abc" and out-of-range values are invalid, "" is blank. */
export function parseMinutes(raw: string, min: number, max: number): ParsedMinutes {
    const text = raw.trim();
    if (text === "") return { kind: "blank" };
    if (!/^\d+$/.test(text)) return { kind: "invalid" };
    const value = Number(text);
    return value >= min && value <= max ? { kind: "ok", value } : { kind: "invalid" };
}

export const minutesErrorMessage = (min: number, max: number) =>
    `Please enter a whole number between ${min} and ${max} minutes.`;

export interface DraftRow {
    entry: ExamTimeEntry;
    minutes: string;
    enabled: boolean;
}

/** Error for one row, or null. A row that already exists must keep a value; a never-configured row may stay blank. */
export function rowError(row: DraftRow, min: number, max: number): string | null {
    const parsed = parseMinutes(row.minutes, min, max);
    if (parsed.kind === "invalid") return minutesErrorMessage(min, max);
    if (parsed.kind === "blank" && row.entry.id != null) return minutesErrorMessage(min, max);
    return null;
}

/** Sum of the enabled rows with a valid value. */
export function sumEnabled(rows: DraftRow[], min: number, max: number): number {
    return rows.reduce((sum, row) => {
        const parsed = parseMinutes(row.minutes, min, max);
        return row.enabled && parsed.kind === "ok" ? sum + parsed.value : sum;
    }, 0);
}

/** Like sumEnabled, but only rows that count towards the exam's total duration. */
export function sumTowardsTotal(rows: DraftRow[], min: number, max: number): number {
    return sumEnabled(
        rows.filter((row) => !OUTSIDE_TOTAL_SECTIONS.includes(row.entry.section)),
        min,
        max,
    );
}

export interface TotalCheck {
    kind: "none" | "review" | "over";
    /** Minutes left for review, or minutes over the duration. */
    minutes: number;
}

export function checkTotal(configured: number, total: number | null): TotalCheck {
    if (total == null) return { kind: "none", minutes: 0 };
    return configured > total
        ? { kind: "over", minutes: configured - total }
        : { kind: "review", minutes: total - configured };
}
