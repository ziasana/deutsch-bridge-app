import type { WritingFormality } from '@/types/writing';
import type {
  RedemittelContext,
  RedemittelExerciseType,
  RedemittelStatus,
} from '@/types/redemittel';
import { SECTION_COLOR } from '@/theme/sectionColors';

/** Accent for everything Redemittel: a warm coral, apart from the blue/green/violet of the other areas. */
export const REDEMITTEL_COLOR: string = SECTION_COLOR.redemittel;
/** Darker shade for text and icons on the light pink tint. */
export const REDEMITTEL_DARK = '#B8346A';

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const CONTEXT_LABELS: Record<RedemittelContext, string> = {
  EVERYDAY: 'Alltag',
  SPEAKING: 'Sprechen',
  WRITING: 'Schreiben',
  EXAM: 'Prüfung',
  WORK: 'Beruf',
  DISCUSSION: 'Diskussion',
};

export const STATUS_LABELS: Record<RedemittelStatus, string> = {
  NEW: 'Neu',
  LEARNING: 'Lernen',
  REVIEW: 'Wiederholen',
  MASTERED: 'Sicher',
};

/** Same order as the web: how far a Redemittel has come, 0 = new … 3 = mastered. */
export const STATUS_STEP: Record<RedemittelStatus, number> = {
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  MASTERED: 3,
};

export const STATUS_COLOR: Record<RedemittelStatus, string> = {
  NEW: '#9AA3B5',
  LEARNING: '#E8892B',
  REVIEW: '#4D94FF',
  MASTERED: '#27AE7A',
};

export const FORMALITY_LABELS: Record<WritingFormality, string> = {
  INFORMAL: 'Informell',
  NEUTRAL: 'Neutral',
  FORMAL: 'Formell',
};

export const EXERCISE_LABELS: Record<RedemittelExerciseType, string> = {
  MEANING: 'Verstehen',
  FUNCTION: 'Funktion',
  FILL_BLANK: 'Ergänzen',
  CLOZE: 'Lückentext',
  SITUATION: 'Situation',
  WORD_ORDER: 'Wortreihenfolge',
  PRODUCTION: 'Eigener Satz',
};

/** "in 1 Tag" / "in 7 Tagen" */
export const inDays = (days: number) => (days === 1 ? 'in 1 Tag' : `in ${days} Tagen`);

/** Decorative emoji per communicative function; unknown (future) functions get a speech bubble. */
const CATEGORY_EMOJI: Record<string, string> = {
  GREETING: '👋',
  INTRODUCTION: '🎬',
  OPINION: '💭',
  REASON: '🧩',
  EXAMPLE: '📌',
  ADDITION: '➕',
  CONTRAST: '🔀',
  AGREEMENT: '👍',
  DISAGREEMENT: '🙅',
  ADVANTAGE_DISADVANTAGE: '📊',
  SUGGESTION: '💡',
  REQUEST: '🙏',
  APOLOGY: '🙇',
  QUESTION: '❓',
  CONCLUSION: '🏁',
};
export const categoryEmoji = (category: string) => CATEGORY_EMOJI[category] ?? '💬';

/** Reviews first, then new Redemittel, then free practice, then exploring. */
export type NextStep = 'review' | 'learn' | 'practice' | null;
export function recommendedStep(h: {
  dueCount: number;
  newToday: number;
  summary: { learned: number };
  savedCount: number;
}): NextStep {
  if (h.dueCount > 0) return 'review';
  if (h.newToday > 0) return 'learn';
  if (h.summary.learned + h.savedCount > 0) return 'practice';
  return null;
}
