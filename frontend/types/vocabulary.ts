export type VocabularySource = "CUSTOM" | "DICTIONARY";
export type VocabularyMasteryLevel = "NEW" | "LEARNING" | "FAMILIAR" | "MASTERED";
export type LearningLevelCode = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

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
    /** Null when the current user hasn't practiced this item yet. */
    progress: VocabularyProgress | null;
    bookmarked: boolean;
}

/** Always creates a source=CUSTOM item. Synonyms are generated server-side, not submitted by the client. */
export interface VocabularyCreateRequest {
    word: string;
    article: string | null;
    meaning: string;
    language: string | null;
    example: string | null;
    level: LearningLevelCode | null;
}

/** Partial update - null fields are left unchanged. */
export interface VocabularyUpdateRequest {
    word?: string | null;
    article?: string | null;
    meaning?: string | null;
    language?: string | null;
    example?: string | null;
    level?: LearningLevelCode | null;
}

export interface PracticeContextOption {
    key: string;
    text: string;
}

/** No correct-answer info here - that's only revealed via VocabularyRoundResponse after submitting. */
export interface PracticeContextQuestion {
    prompt: string;
    isCloze: boolean;
    options: PracticeContextOption[];
}

export interface PracticeVocabularyItem {
    vocabularyItemId: string;
    source: VocabularySource;
    word: string;
    article: string | null;
    meaning: string;
    example: string | null;
    synonyms: string | null;
    level: LearningLevelCode | null;
    audioUrl: string | null;
    masteryLevel: VocabularyMasteryLevel;
    isNew: boolean;
    /** Null when the user's pool has fewer than 4 items - the round is flashcard-only then. */
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
    /** Null if the context step was skipped (no question was generated) or not answered. */
    contextSelectedKey: string | null;
}

export interface VocabularyRoundResponse {
    flashcardCorrect: boolean;
    /** Null when no context question was asked this round. */
    contextCorrect: boolean | null;
    /** Null when no context question was asked this round; set whenever one was, regardless of whether the user answered it. */
    correctContextKey: string | null;
    progress: VocabularyProgress;
}
