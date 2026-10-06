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

export type VocabularySource = 'CUSTOM' | 'DICTIONARY' | 'AI_TUTOR';
export type LearningLevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/** A word in the learner's own vocabulary list. */
export interface VocabularyItem {
  id: string;
  source: VocabularySource;
  word: string;
  article: string | null;
  meaning: string;
  language: string;
  example: string | null;
  synonyms: string | null;
  level: LearningLevelCode | null;
  audioUrl: string | null;
  /** Only set for source=DICTIONARY. */
  dictionaryEntryId: string | null;
  createdAt: string;
  /** Null until the learner practised this word. */
  progress: VocabularyProgress | null;
  bookmarked: boolean;
}

/** Creates a source=CUSTOM word (synonyms are generated server-side). */
export interface VocabularyCreateRequest {
  word: string;
  article: string | null;
  meaning: string;
  language: string | null;
  example: string | null;
  level: LearningLevelCode | null;
}

/** Partial update: null fields stay unchanged. */
export interface VocabularyUpdateRequest {
  word?: string | null;
  article?: string | null;
  meaning?: string | null;
  language?: string | null;
  example?: string | null;
  level?: LearningLevelCode | null;
}
