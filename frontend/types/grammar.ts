export interface QuizQuestion {
    type: "mcq" | "fill" | "truefalse";
    title: string;
    question: string;
    options?: string[];
    answer: string | boolean;
    /** Persian translation of the instructional text - only used for A1-B1 lessons; options/answer stay language-invariant. */
    titleFa?: string | null;
    questionFa?: string | null;
}

export interface LearningProgress {
    id: string;
    learned: boolean;
}

export type GrammarLessonStatus = "DRAFT" | "PUBLISHED";

/** Levels whose lessons can carry a Persian translation - B2 and up stay single-language. */
export const TRANSLATABLE_GRAMMAR_LEVELS = ["A1", "A2", "B1"];

export interface GrammarLesson {
    id: string;
    title: string;
    summary: string;
    content: string;
    level: string;
    example: string;
    usageTips: string;
    titleFa: string | null;
    summaryFa: string | null;
    contentFa: string | null;
    exampleFa: string | null;
    usageTipsFa: string | null;
    videoLink: string | null;
    status: GrammarLessonStatus;
    quiz: QuizQuestion[];
    learningProgresses: LearningProgress[];
    createdAt: string;
    updatedAt: string;
    categoryId: string | null;
    categoryTitle: string | null;
    sortOrder: number;
}

export interface GrammarLessonManualRequest {
    title: string;
    level: string;
    summary: string;
    content: string;
    example: string;
    usageTips: string;
    titleFa: string | null;
    summaryFa: string | null;
    contentFa: string | null;
    exampleFa: string | null;
    usageTipsFa: string | null;
    videoLink: string | null;
    status: GrammarLessonStatus;
    quiz: QuizQuestion[];
    categoryId: string | null;
    sortOrder: number;
}

export interface LearningProgressRequest {
    lessonId?: string;
    dailyWordId?: string;
    readingId?: string;
    learned: boolean;
}

export interface GrammarCategory {
    id: string;
    title: string;
    titleFa: string | null;
    level: string;
    sortOrder: number;
    passThreshold: number;
    lessonCount: number;
}

export interface GrammarCategoryManualRequest {
    title: string;
    titleFa: string | null;
    level: string;
    sortOrder: number;
    passThreshold: number;
}

export interface CategoryTestStatus {
    attempted: boolean;
    score: number;
    total: number;
    passed: boolean;
    completed: boolean;
    passThreshold: number;
}

export interface GrammarCategoryWithLessons {
    id: string;
    title: string;
    titleFa: string | null;
    level: string;
    sortOrder: number;
    passThreshold: number;
    lessons: GrammarLesson[];
    testStatus: CategoryTestStatus;
}

/** Lightweight list row - no content/examples/usage tips/quiz; fetch the lesson by id for those. */
export interface GrammarLessonSummary {
    id: string;
    title: string;
    titleFa: string | null;
    summary: string;
    summaryFa: string | null;
    level: string;
    quizCount: number;
    learned: boolean;
}

export interface GrammarCategorySummary {
    id: string;
    title: string;
    titleFa: string | null;
    level: string;
    sortOrder: number;
    passThreshold: number;
    lessons: GrammarLessonSummary[];
    testStatus: CategoryTestStatus;
}

/** Everything the grammar list shows for one level. */
export interface GrammarLevelView {
    level: string;
    categories: GrammarCategorySummary[];
    uncategorized: GrammarLessonSummary[];
}

export interface GrammarLevelSummary {
    level: string;
    total: number;
    learned: number;
}

export interface CategoryTestSubmitRequest {
    score: number;
    total: number;
}
