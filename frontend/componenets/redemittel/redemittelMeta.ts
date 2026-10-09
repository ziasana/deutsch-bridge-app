import { FORMALITY_LABELS } from "@/componenets/exam/writing/writingMeta";
import { RedemittelContext, RedemittelStatus } from "@/types/redemittel";

/** The Redemittel colour (indigo); the page follows the level colour while a level filter is on. */
export const REDEMITTEL_ACCENT = "#6366f1";

export const REDEMITTEL_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const CONTEXT_LABELS: Record<RedemittelContext, string> = {
    EVERYDAY: "Alltag",
    SPEAKING: "Sprechen",
    WRITING: "Schreiben",
    EXAM: "Prüfung",
    WORK: "Beruf",
    DISCUSSION: "Diskussion",
};

export const STATUS_LABELS: Record<RedemittelStatus, string> = {
    NEW: "Neu",
    LEARNING: "Lernen",
    REVIEW: "Wiederholen",
    MASTERED: "Sicher",
};

export { FORMALITY_LABELS };

/** "in 1 Tag" / "in 7 Tagen" */
export function inDays(days: number): string {
    return days === 1 ? "in 1 Tag" : `in ${days} Tagen`;
}

/** Decorative emoji per communicative function; unknown (future) functions fall back to a speech bubble. */
const CATEGORY_EMOJI: Record<string, string> = {
    GREETING: "👋",
    INTRODUCTION: "🎬",
    OPINION: "💭",
    REASON: "🧩",
    EXAMPLE: "📌",
    ADDITION: "➕",
    CONTRAST: "🔀",
    AGREEMENT: "👍",
    DISAGREEMENT: "🙅",
    ADVANTAGE_DISADVANTAGE: "📊",
    SUGGESTION: "💡",
    REQUEST: "🙏",
    APOLOGY: "🙇",
    QUESTION: "❓",
    CONCLUSION: "🏁",
};

export function categoryEmoji(category: string): string {
    return CATEGORY_EMOJI[category] ?? "💬";
}

/** How far a Redemittel has come: 0 = new ... 3 = mastered (drives the little progress stepper). */
export const STATUS_STEP: Record<RedemittelStatus, number> = { NEW: 0, LEARNING: 1, REVIEW: 2, MASTERED: 3 };
