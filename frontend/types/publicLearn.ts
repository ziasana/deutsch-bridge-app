import type { QuizQuestion } from "./grammar";

/** The public "try it free" learning area (GET /api/public/learn/...): the dashboard's lists, with the first item of each category open. */
export interface LevelCount {
    level: string;
    total: number;
    free: number;
}

export interface PublicOverview {
    grammar: LevelCount[];
    redemittel: LevelCount[];
    expressions: LevelCount[];
    reading: LevelCount[];
}

export interface PublicGrammarLesson {
    id: string;
    title: string;
    titleFa: string | null;
    /** Null for a locked lesson: it is listed by title only. */
    summary: string | null;
    summaryFa: string | null;
    level: string;
    quizCount: number;
    free: boolean;
}

export interface PublicGrammarCategory {
    id: string;
    title: string;
    titleFa: string | null;
    level: string | null;
    lessons: PublicGrammarLesson[];
}

export interface PublicGrammarLevelView {
    level: string;
    categories: PublicGrammarCategory[];
    uncategorized: PublicGrammarLesson[];
}

export interface PublicGrammarFull {
    id: string;
    title: string;
    titleFa: string | null;
    summary: string | null;
    summaryFa: string | null;
    content: string;
    contentFa: string | null;
    example: string | null;
    exampleFa: string | null;
    usageTips: string | null;
    usageTipsFa: string | null;
    videoLink: string | null;
    level: string;
    categoryTitle: string | null;
    quiz: QuizQuestion[];
}

export interface PublicCategory {
    key: string;
    label: string;
    count: number;
}

/** Locked items carry only id, level, category and phrase. */
export interface PublicPhrase {
    id: string;
    level: string;
    category: string;
    categoryLabel: string;
    phrase: string;
    free: boolean;
    meaning: string | null;
    explanation: string | null;
    example: string | null;
    formality: "INFORMAL" | "NEUTRAL" | "FORMAL" | null;
    usageNote: string | null;
    grammarPattern: string | null;
    commonMistake: string | null;
    similarExpressions: string[] | null;
    contexts: string[] | null;
}

/**
 * A page of the sample listing. totalElements / totalPages describe the sample (at most sampleLimit entries per level and topic);
 * total is the real number of entries in the library for the same filter.
 */
export interface PublicPage<T> {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    total: number;
    sampleLimit: number;
}

export type PublicPhrasePage = PublicPage<PublicPhrase> & { categories: PublicCategory[] };

export interface PublicExpressionItem {
    id: string;
    expression: string;
    level: string;
    free: boolean;
    meaningDe: string | null;
    meaningEn: string | null;
    register: string | null;
    imageUrl: string | null;
    exampleSentence: string | null;
}

export interface PublicExpressionFull {
    id: string;
    type: string;
    level: string;
    expression: string;
    meaningDe: string | null;
    meaningEn: string | null;
    meaningFa: string | null;
    literalMeaning: string | null;
    figurativeMeaning: string | null;
    grammarNote: string | null;
    usageNote: string | null;
    register: string | null;
    commonMistakes: string | null;
    imageUrl: string | null;
    examples: { sentence: string; translationEn: string | null; translationFa: string | null }[];
    patterns: { pattern: string; grammarCase: string | null; preposition: string | null; example: string | null }[];
}

export interface PublicArticleItem {
    id: string;
    title: string;
    categoryId: string | null;
    categoryTitle: string | null;
    level: string;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    free: boolean;
}

export type PublicArticlePage = PublicPage<PublicArticleItem> & { categories: PublicCategory[] };

export interface PublicNote {
    start: number;
    end: number;
    surfaceText: string;
    lemma: string | null;
    pos: string | null;
    gender: string | null;
    translationEn: string;
    exampleSentence: string | null;
}

export interface PublicQuizQuestion {
    id: string;
    type: string;
    prompt: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string | null;
}

export interface PublicArticleFull {
    id: string;
    title: string;
    level: string;
    categoryTitle: string | null;
    imageUrl: string | null;
    content: string;
    notes: PublicNote[];
    keyVocabulary: { word: string; meaning: string }[];
    quiz: PublicQuizQuestion[];
}
