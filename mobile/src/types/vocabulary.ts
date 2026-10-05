export type VocabularyMasteryLevel = 'NEW' | 'LEARNING' | 'FAMILIAR' | 'MASTERED';

export interface VocabularyProgress {
  recallScore: number;
  contextScore: number;
  overallScore: number;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: VocabularyMasteryLevel;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
}

export interface PracticeContextOption {
  key: string;
  text: string;
}

/** The correct answer is only revealed by the round response after submitting. */
export interface PracticeContextQuestion {
  prompt: string;
  isCloze: boolean;
  options: PracticeContextOption[];
}

export interface PracticeVocabularyItem {
  vocabularyItemId: string;
  source: string;
  word: string;
  article: string | null;
  meaning: string;
  example: string | null;
  synonyms: string | null;
  level: string | null;
  audioUrl: string | null;
  masteryLevel: VocabularyMasteryLevel;
  isNew: boolean;
  /** Null when the learner's pool has fewer than 4 words: the round is flashcard-only. */
  contextQuestion: PracticeContextQuestion | null;
}

export interface PracticeVocabularySession {
  items: PracticeVocabularyItem[];
  newCount: number;
  reviewCount: number;
}

export interface VocabularyRoundRequest {
  vocabularyItemId: string;
  flashcardKnewIt: boolean;
  contextSelectedKey: string | null;
}

export interface VocabularyRoundResponse {
  flashcardCorrect: boolean;
  contextCorrect: boolean | null;
  correctContextKey: string | null;
  progress: VocabularyProgress;
}
