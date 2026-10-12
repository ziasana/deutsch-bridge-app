import type { AxiosError } from "axios";
import type { ExamSimulationError, ResultStatus } from "@/types/examSimulation";
import type { ExamSection } from "@/types/exam";

/** German labels of the result statuses; written, oral and overall results are always shown separately. */
export const RESULT_LABEL: Record<ResultStatus, string> = {
    PASSED: "Bestanden",
    NOT_PASSED: "Nicht bestanden",
    AWAITING_ASSESSMENT: "Bewertung steht noch aus",
    NOT_ASSESSED: "Nicht bewertet",
    INCOMPLETE: "Unvollständig",
};

export const RESULT_TONE: Record<ResultStatus, string> = {
    PASSED: "bg-green-500/15 text-green-700 dark:text-green-400",
    NOT_PASSED: "bg-red-500/15 text-red-700 dark:text-red-400",
    AWAITING_ASSESSMENT: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    NOT_ASSESSED: "bg-foreground/10 text-foreground/70",
    INCOMPLETE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

/** Why the overall result is what it is, so a missing assessment is never left unexplained. */
export const OVERALL_EXPLANATION: Record<string, string> = {
    ALL_PASSED: "Schriftliche und mündliche Prüfung sind bestanden.",
    WRITTEN_NOT_PASSED: "Die schriftliche Prüfung wurde nicht bestanden. Damit ist die Gesamtprüfung nicht bestanden.",
    WRITTEN_ASSESSMENT_PENDING:
        "Die schriftliche Prüfung kann noch nicht bewertet werden, weil der Schriftliche Ausdruck noch nicht beurteilt wurde. Das Ergebnis ist vorläufig.",
    ORAL_NOT_ASSESSED:
        "Die schriftliche Prüfung ist bestanden. Die mündliche Prüfung ist in dieser Simulation nur eine Übung und wird nicht bewertet – deshalb kann kein Gesamtergebnis angegeben werden.",
    ORAL_ASSESSMENT_PENDING: "Die mündliche Prüfung wartet noch auf ihre Bewertung.",
    ORAL_NOT_PASSED: "Die mündliche Prüfung wurde nicht bestanden. Damit ist die Gesamtprüfung nicht bestanden.",
    WRITTEN_RESULT_ONLY: "Für dieses Prüfungsprofil entscheidet allein die schriftliche Prüfung.",
};

export const SECTION_LABEL: Record<ExamSection, string> = {
    LESEVERSTEHEN: "Leseverstehen",
    SPRACHBAUSTEINE: "Sprachbausteine",
    HOERVERSTEHEN: "Hörverstehen",
    SCHRIFTLICHER_AUSDRUCK: "Schriftlicher Ausdruck",
    MUENDLICHER_AUSDRUCK: "Mündlicher Ausdruck",
    TESTFORMAT_INFORMATION: "Testformat",
};

export const BLOCKED_REASON: Record<string, string> = {
    ACTIVE_ATTEMPT: "Du hast bereits eine Prüfung begonnen.",
    PROFILE_INVALID: "Dieses Prüfungsprofil ist derzeit nicht verfügbar.",
    INSUFFICIENT_CONTENT:
        "Für ein neues Prüfungsset fehlen noch ungenutzte Aufgaben. Bereits verwendete Aufgaben werden nie wiederholt.",
};

/** Points with at most one decimal place, German decimal comma: 7.5 -> "7,5", 25 -> "25". */
export function formatPoints(value: number | null | undefined): string {
    if (value == null) return "–";
    return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value);
}

export function formatDuration(seconds: number | null | undefined): string {
    if (seconds == null) return "–";
    const minutes = Math.round(seconds / 60);
    return `${minutes} Min.`;
}

export function formatDateTime(ms: number | null | undefined): string {
    if (ms == null) return "–";
    return new Date(ms).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

/** The structured error body of the exam simulation API, if the request failed with one. */
export function simulationError(error: unknown): ExamSimulationError | null {
    const data = (error as AxiosError<ExamSimulationError>)?.response?.data;
    return data && typeof data === "object" && "message" in data ? data : null;
}

export function simulationErrorMessage(error: unknown, fallback: string): string {
    const e = simulationError(error);
    if (!e) return fallback;
    if (e.code === "INSUFFICIENT_CONTENT") return BLOCKED_REASON.INSUFFICIENT_CONTENT;
    if (e.code === "ACTIVE_ATTEMPT_EXISTS") return BLOCKED_REASON.ACTIVE_ATTEMPT;
    return e.message || fallback;
}
