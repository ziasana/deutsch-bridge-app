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
}

export interface LearningProgressRequest {
    lessonId?: string;
    dailyWordId?: string;
    readingId?: string;
    learned: boolean;
}
