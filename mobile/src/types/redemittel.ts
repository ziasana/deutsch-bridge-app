import type { WritingFormality } from './writing';

export type RedemittelStatus = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
export type RedemittelContext =
  'EVERYDAY' | 'SPEAKING' | 'WRITING' | 'EXAM' | 'WORK' | 'DISCUSSION';
/** MEANING / FILL_BLANK / SITUATION / PRODUCTION are written by an admin; FUNCTION / CLOZE / WORD_ORDER are derived. */
export type RedemittelExerciseType =
  'MEANING' | 'FUNCTION' | 'FILL_BLANK' | 'CLOZE' | 'SITUATION' | 'WORD_ORDER' | 'PRODUCTION';

/** A Redemittel with the caller's own progress; optional fields are absent when the admin has not authored them. */
export interface Redemittel {
  id: string;
  level: string;
  category: string;
  categoryLabel: string;
  phrase: string;
  meaning: string | null;
  explanation: string | null;
  example: string | null;
  formality: WritingFormality | null;
  usageNote: string | null;
  grammarPattern: string | null;
  commonMistake: string | null;
  similarExpressions: string[];
  contexts: RedemittelContext[];
  status: RedemittelStatus;
  nextReviewAt: string | null;
  saved: boolean;
}

export interface RedemittelPage {
  items: Redemittel[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface RedemittelHub {
  dueCount: number;
  newToday: number;
  dailyTarget: number;
  learnedToday: number;
  savedCount: number;
  summary: { learned: number; mastered: number; review: number; learning: number; fresh: number };
  categories: { key: string; label: string; count: number }[];
}

export interface RedemittelExercise {
  exerciseId: string;
  phraseId: string;
  type: RedemittelExerciseType;
  prompt: string;
  topic: string | null;
  phrase: string | null;
  options: { id: string; text: string }[] | null;
}

export interface RedemittelSession {
  exercises: RedemittelExercise[];
  total: number;
}

export interface RedemittelAnswer {
  correct: boolean;
  attempted: boolean;
  correctAnswer: string;
  modelAnswer: string | null;
  status: RedemittelStatus;
  nextReviewAt: string | null;
  nextReviewInDays: number | null;
}

export interface RedemittelListParams {
  level?: string;
  category?: string;
  search?: string;
  status?: RedemittelStatus;
  saved?: boolean;
}
