import type { RedemittelContext } from "@/types/redemittel";


export type WritingGuideKind =
    | "FORMAT"
    | "STRATEGY_STEP"
    | "STRUCTURE_PART"
    | "EXAMPLE"
    | "SENTENCE_PATTERN"
    | "MISTAKE"
    | "CHECKLIST_ITEM";

/** Id of the Redemittel function (Funktion); admin-managed, so any string. */
export type WritingPhraseCategory = string;

export type WritingFormality = "INFORMAL" | "NEUTRAL" | "FORMAL";

export interface WritingFormatData {
    time?: string;
    requirements?: string[];
}
export interface WritingStrategyData {
    tips?: string[];
}
export interface WritingStructureData {
    examples?: string[];
    phrases?: string[];
}
export interface WritingExampleSection {
    key: string;
    label: string;
    text: string;
    why?: string;
    phrases?: string[];
}
export interface WritingExampleData {
    sections?: WritingExampleSection[];
}
export interface WritingSentencePatternData {
    examples?: string[];
}
export interface WritingMistakeData {
    wrong?: string;
    right?: string;
}

export interface WritingGuideItem<D = unknown> {
    id: string;
    kind: WritingGuideKind;
    title: string;
    content: string | null;
    data: D | null;
    sortOrder: number;
}

export interface WritingPhrase {
    id: string;
    category: WritingPhraseCategory;
    categoryLabel: string;
    phrase: string;
    explanation: string | null;
    example: string | null;
    formality: WritingFormality | null;
    usageNote: string | null;
    sortOrder: number;
}

export interface WritingLearningResponse {
    level: string;
    items: WritingGuideItem[];
    phrases: WritingPhrase[];
}

/** How much help is available while writing. */
export type WritingMode = "LEARN" | "PRACTICE" | "EXAM";

export type WritingHelpTab = "TIP" | "EXAMPLE" | "PHRASES" | "MISTAKES";

export interface WritingAttemptRequest {
    exerciseId: string;
    text: string;
    mode: WritingMode;
    planNotes?: string[];
    parentAttemptId?: string | null;
}

export interface WritingAttempt {
    id: string;
    exerciseId: string;
    mode: WritingMode;
    text: string;
    planNotes: string[];
    wordCount: number;
    attemptNumber: number;
    parentAttemptId: string | null;
    submittedAt: string;
    feedback: WritingFeedback | null;
    /** Present once the learner has requested AI feedback for this attempt. */
    aiFeedback: WritingAiFeedback | null;
}

export type WritingFeedbackStatus = "GOOD" | "OK" | "IMPROVE" | "NOT_ASSESSED";

export interface WritingFeedbackDimension {
    key: "TASK" | "STRUCTURE" | "LANGUAGE" | "VOCABULARY" | "FORM";
    title: string;
    status: WritingFeedbackStatus;
    positives: string[];
    improvements: string[];
}

/** Multi-dimensional feedback - intentionally has no overall score. `source` is "RULES" today, "AI" later. */
export interface WritingFeedback {
    source: string;
    dimensions: WritingFeedbackDimension[];
    highlights: string[];
    nextFocus: string[];
    stats: {
        wordCount: number;
        sentenceCount: number;
        paragraphCount: number;
        connectorCount: number;
        usedPhrases: string[];
        uncoveredLeitpunkte: string[];
    };
}

export interface WritingAiFeedback {
    positives: string[];
    missingPoints: string[];
    grammar: { original: string; corrected: string; explanation: string }[];
    vocabulary: string[];
    structure: string[];
    improvementExample: string | null;
}

/** Admin shapes: same fields as the learner content plus level/active, used for both reads and writes. */
/** Admin list row - no content/data; fetch the item by id to edit it. */
export interface AdminWritingGuideItemRow {
    id: string;
    level: string;
    kind: WritingGuideKind;
    title: string;
    sortOrder: number;
    active: boolean;
}

export interface AdminWritingGuideItem {
    id?: string;
    level: string;
    kind: WritingGuideKind;
    title: string;
    content: string | null;
    data: unknown;
    sortOrder: number;
    active: boolean;
}

/** Admin list row - no explanation/usage/meaning fields; fetch the phrase by id to edit it. */
export interface AdminWritingPhraseRow {
    id: string;
    level: string;
    category: WritingPhraseCategory;
    phrase: string;
    active: boolean;
    sortOrder: number;
    exerciseCount: number;
}

export interface AdminWritingPhrase {
    id?: string;
    level: string;
    category: WritingPhraseCategory;
    phrase: string;
    explanation: string | null;
    example: string | null;
    formality: WritingFormality | null;
    usageNote: string | null;
    sortOrder: number;
    active: boolean;
    meaningEn: string | null;
    meaningFa: string | null;
    grammarPattern: string | null;
    commonMistake: string | null;
    similarExpressions: string[];
    contexts: RedemittelContext[];
}

export interface WritingProgress {
    attemptsCount: number;
    exercisesWritten: number;
    revisedTexts: number;
    totalWords: number;
    topIssues: { key: string; title: string; count: number }[];
    recentGrammarFixes: { original: string; corrected: string; explanation: string }[];
}
