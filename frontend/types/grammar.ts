export interface QuizQuestion {
    type: "mcq" | "fill" | "truefalse";
    title: string;
    question: string;
    options?: string[];
    answer: string | boolean;
}

export interface LearningProgress {
    id: string;
    learned: boolean;
}

export interface GrammarLesson {
    id: string;
    title: string;
    summary: string;
    content: string;
    level: string;
    example: string;
    usageTips: string;
    quiz: QuizQuestion[];
    learningProgresses: LearningProgress[];
}

export interface LearningProgressRequest {
    lessonId?: string;
    nomenVerbId?: string;
    dailyWordId?: string;
    readingId?: string;
    learned: boolean;
}
