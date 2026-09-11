export type ExamSection =
    | "LESEVERSTEHEN"
    | "SPRACHBAUSTEINE"
    | "HOERVERSTEHEN"
    | "SCHRIFTLICHER_AUSDRUCK";

export type ExamTaskType = "MATCHING" | "MULTIPLE_CHOICE" | "TRUE_FALSE_NOT_GIVEN";

export interface ExamPassage {
    id: string;
    label: string;
    /** HTML content authored with the rich-text editor. */
    content: string;
    imageUrl: string | null;
}

export interface ExamQuestion {
    id: string;
    taskType: ExamTaskType;
    prompt: string;
    /** Index into the exercise's passages list. Used by MATCHING (which text this asks about) and TRUE_FALSE_NOT_GIVEN. */
    sectionIndex: number | null;
    /** MULTIPLE_CHOICE options; null for MATCHING (uses the exercise-level shared answerOptions pool) and TRUE_FALSE_NOT_GIVEN. */
    options: string[] | null;
    /** MC: matches an options entry. TFN: "RICHTIG"|"FALSCH"|"NICHT_IM_TEXT". MATCHING: matches an entry in the exercise's answerOptions. */
    correctAnswer: string;
    explanation: string;
    commonMistake: string;
}

export interface ExamExerciseResponse {
    id: string;
    title: string;
    section: ExamSection;
    taskType: ExamTaskType;
    level: string;
    partNumber: number | null;
    passages: ExamPassage[];
    questions: ExamQuestion[];
    /** MATCHING only: shared pool of candidate headlines (includes distractors), one per line. */
    answerOptions: string[] | null;
    defaultExplanation: string | null;
    defaultCommonMistake: string | null;
    published: boolean;
    createdAt: string;
}

export interface ExamPassagePublic {
    id: string;
    label: string;
    content: string;
    imageUrl: string | null;
}

export interface ExamQuestionPublic {
    id: string;
    taskType: ExamTaskType;
    prompt: string;
    sectionIndex: number | null;
    options: string[] | null;
}

export interface ExamExercisePublicResponse {
    id: string;
    title: string;
    section: ExamSection;
    taskType: ExamTaskType;
    level: string;
    partNumber: number | null;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[] | null;
}

export interface ExamExerciseManualRequest {
    title: string;
    section: ExamSection;
    taskType: ExamTaskType;
    level: string;
    partNumber: number | null;
    passages: ExamPassage[];
    questions: ExamQuestion[];
    answerOptions: string[] | null;
    defaultExplanation: string | null;
    defaultCommonMistake: string | null;
    published: boolean;
}

// ---- Attempts ----

export interface StartExamAttemptResponse {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[] | null;
}

export interface SubmitExamAnswerRequest {
    questionId: string;
    answer: string;
}

export interface ExamAnswerFeedbackResponse {
    correct: boolean;
    correctAnswer: string;
    explanation: string;
    commonMistake: string;
}

export interface ExamAnswerRecord {
    questionId: string;
    answer: string;
    correct: boolean;
    explanation: string;
    commonMistake: string;
}

export type CompleteExamAttemptRequest = Record<string, never>;

export interface ExamAttemptResultResponse {
    attemptId: string;
    score: number;
    answerBreakdown: ExamAnswerRecord[];
}
