import type { ExamContentStatus } from "./examContent";

export type ExamSection =
    | "LESEVERSTEHEN"
    | "SPRACHBAUSTEINE"
    | "HOERVERSTEHEN"
    | "SCHRIFTLICHER_AUSDRUCK"
    | "MUENDLICHER_AUSDRUCK"
    | "TESTFORMAT_INFORMATION";

export type ExamTaskType =
    | "MATCHING"
    | "SITUATION_MATCHING"
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE_NOT_GIVEN"
    | "WORD_BANK_CLOZE"
    | "WRITING_TASK"
    | "TOPIC_INTERVIEW"
    | "OPINION_DISCUSSION"
    | "JOINT_PLANNING";

/** The three Mündlicher Ausdruck task types, in Teil order. All learning content is German only. */
export type SpeakingTaskType = "TOPIC_INTERVIEW" | "OPINION_DISCUSSION" | "JOINT_PLANNING";

/** Exercise-specific part of a topic (Teil 1): only the example answers - questions and Redemittel are in the guide. */
export interface SpeakingTopic {
    id: string;
    title: string;
    exampleAnswers: string[];
}

/**
 * The content of ONE imported Mündlicher Ausdruck exercise. It holds only what is specific to the exercise; the questions, Redemittel
 * and tips shared by all exercises of a Teil are in the {@link SpeakingGuideContent} (Lernbereich).
 */
export interface SpeakingContent {
    taskType: SpeakingTaskType;
    topic: string | null;
    /** Optional per-exercise checklist; when empty the guide's checklist is used. */
    selfAssessment: string[];
    // Teil 1
    exampleProfile?: string | null;
    topics?: SpeakingTopic[];
    // Teil 2
    person?: { name: string | null; age: number | null; occupation: string | null; image?: string; imageAlt?: string };
    opinionText?: string | null;
    preparationNotes?: string[];
    exampleResponse?: string | null;
    // Teil 3
    scenario?: string | null;
    planningPoints?: { id: string; title: string; hint?: string | null }[];
    extraPhrases?: string[];
    decisionCriteria?: string[];
    exampleDialogue?: { speaker: "A" | "B"; text: string }[];
}

export interface SpeakingTitledText {
    title: string;
    text: string;
}

export interface SpeakingGuideTopic {
    id: string;
    title: string;
    questions: string[];
    followUpQuestions: string[];
    usefulPhrases: string[];
    tip?: string | null;
}

export interface SpeakingGuideGoal {
    id: string;
    title: string;
    description: string;
    usefulPhrases: string[];
    tip?: string | null;
}

export interface SpeakingGuideFunction {
    function: string;
    title: string;
    usefulPhrases: string[];
    tip?: string | null;
}

/** The Lernbereich of one Teil: the shared learning content, German only. */
export interface SpeakingGuideContent {
    intro: string;
    tips: SpeakingTitledText[];
    steps: SpeakingTitledText[];
    commonMistakes: string[];
    selfAssessment: string[];
    // Teil 1
    topics?: SpeakingGuideTopic[];
    usefulPhrases?: string[];
    // Teil 2
    goals?: SpeakingGuideGoal[];
    // Teil 3
    functions?: SpeakingGuideFunction[];
    decisionCriteria?: string[];
}

export interface SpeakingGuide {
    level: string;
    part: number;
    content: SpeakingGuideContent;
    updatedAt: string | null;
}

export type ExamFieldPresetType = "TEIL_DESCRIPTION" | "DEFAULT_EXPLANATION" | "DEFAULT_COMMON_MISTAKE";

/** A named, reusable snippet for one of the exercise form's repetitive fields, scoped to one section + level. */
export interface ExamFieldPreset {
    id: string;
    section: ExamSection;
    level: string;
    fieldType: ExamFieldPresetType;
    label: string;
    value: string;
}

export interface ExamFieldPresetRequest {
    section: ExamSection;
    level: string;
    fieldType: ExamFieldPresetType;
    label: string;
    value: string;
}

export interface ExamPassage {
    id: string;
    label: string;
    /** HTML content authored with the rich-text editor. */
    content: string;
    imageUrl: string | null;
    /** Relative "/uploads/exam-audio/..." URL - set for Hoerverstehen listening clips. */
    audioUrl: string | null;
    /** Full script of the audio. Admin-only (never sent to students before they answer). */
    transcript: string | null;
}

export interface ExamQuestion {
    id: string;
    taskType: ExamTaskType;
    prompt: string;
    /** Index into the exercise's passages list. Used by MATCHING (which text this asks about) and TRUE_FALSE_NOT_GIVEN. */
    sectionIndex: number | null;
    /** MULTIPLE_CHOICE options; null for MATCHING (uses the exercise-level shared answerOptions pool) and TRUE_FALSE_NOT_GIVEN. */
    options: string[] | null;
    /** SITUATION_MATCHING: the matching passage's id, or "X" for no ad. MC: matches an options entry. TFN: "RICHTIG"|"FALSCH"|"NICHT_IM_TEXT". MATCHING/WORD_BANK_CLOZE: matches an entry in the exercise's answerOptions. */
    correctAnswer: string;
    /** WORD_BANK_CLOZE only: the gap's number, matching the marker embedded in the passage content. */
    gapNumber: number | null;
    /** Admin-assigned exam numbering (e.g. 41, 56) shown to students instead of 1,2,3... Null until set; backend defaults it to list position on save. */
    questionNumber: number | null;
    explanation: string;
    commonMistake: string;
}

/** Admin list row - no passages/questions; fetch the exercise by id to edit it. */
export interface ExamExerciseAdminRow {
    id: string;
    title: string;
    section: ExamSection;
    taskType: ExamTaskType | null;
    level: string | null;
    partNumber: number | null;
    published: boolean;
    questionCount: number;
    examType: string | null;
    status: ExamContentStatus | null;
    externalId: string | null;
    version: number;
    difficulty: string | null;
    updatedAt: string | null;
}

export interface ExamExerciseResponse {
    id: string;
    title: string;
    section: ExamSection;
    /** Null for TESTFORMAT_INFORMATION, which has no quiz. */
    taskType: ExamTaskType | null;
    /** Null means the content applies to any level (used by TESTFORMAT_INFORMATION). */
    level: string | null;
    partNumber: number | null;
    passages: ExamPassage[];
    questions: ExamQuestion[];
    /** MATCHING only: shared pool of candidate headlines (includes distractors), one per line. */
    answerOptions: string[] | null;
    /** Optional admin-edited labels ("a", "1", ...) per answerOptions entry, by index; blank = default letter. */
    answerOptionLabels: string[] | null;
    defaultExplanation: string | null;
    defaultCommonMistake: string | null;
    /** Shown to the student at the start of this Teil, before the passages/questions. */
    teilDescription: string | null;
    /** SCHRIFTLICHER_AUSDRUCK only: the "mögliche Antwort" revealed to students via a button. */
    modelSolution: string | null;
    /** SCHRIFTLICHER_AUSDRUCK only: offer the optional planner before writing. */
    requiresPlanning: boolean;
    /** SCHRIFTLICHER_AUSDRUCK only: the task's Leitpunkte (planner prompts). */
    leitpunkte: string[] | null;
    published: boolean;
    createdAt: string;
    examType: string | null;
    status: ExamContentStatus | null;
    externalId: string | null;
    version: number;
    metadata: Record<string, unknown> | null;
}

export interface ExamPassagePublic {
    id: string;
    label: string;
    content: string;
    imageUrl: string | null;
    audioUrl: string | null;
}

export interface ExamQuestionPublic {
    id: string;
    taskType: ExamTaskType;
    prompt: string;
    sectionIndex: number | null;
    options: string[] | null;
    gapNumber: number | null;
    /** Admin-assigned exam numbering, sorted ascending by the server - null falls back to position. */
    questionNumber: number | null;
}

export interface ExamExercisePublicResponse {
    id: string;
    title: string;
    section: ExamSection;
    taskType: ExamTaskType | null;
    level: string | null;
    partNumber: number | null;
    /** Resolved Teil number - the key for looking up this Teil's recommended time. */
    teil: number | null;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[] | null;
    /** Optional admin-edited labels ("a", "1", ...) per answerOptions entry, by index; blank = default letter. */
    answerOptionLabels: string[] | null;
    /** Shown to the student at the start of this Teil, before the passages/questions. */
    teilDescription: string | null;
    /** SCHRIFTLICHER_AUSDRUCK only: the "mögliche Antwort" revealed via a button. */
    modelSolution: string | null;
    requiresPlanning: boolean;
    leitpunkte: string[] | null;
    /** General tip/mistake-avoidance guidance for this whole Teil - shown once on the results screen, not per question. */
    defaultExplanation: string | null;
    defaultCommonMistake: string | null;
    completed: boolean;
    /** Percentage (0-100) from the most recent completed attempt, or null if never attempted. */
    lastScore: number | null;
    bookmarked: boolean;
    /** MUENDLICHER_AUSDRUCK only: the structured, German-only speaking content. */
    speaking?: SpeakingContent | null;
}

/**
 * Lightweight navigation/summary shape - no passages/questions/answerOptions - used for section
 * tabs, the level selector, and Teil listings. Full content is only ever fetched per-exercise via
 * getExamExerciseById.
 */
export interface ExamExerciseSummaryResponse {
    id: string;
    title: string;
    section: ExamSection;
    taskType: ExamTaskType | null;
    level: string | null;
    partNumber: number | null;
    /** Resolved Teil number - the key for looking up this Teil's recommended time. */
    teil: number | null;
    /** Shown inline for informational (level-agnostic) entries like Testformat Information. */
    teilDescription: string | null;
    questionsCount: number;
    completed: boolean;
    lastScore: number | null;
    bookmarked: boolean;
}

/** A bookmarked exercise the user hasn't mastered yet (the "saved for later" strip), from any level. */
export interface ExamPendingBookmark {
    id: string;
    title: string;
    section: ExamSection;
    level: string | null;
    bookmarkedAt: string;
}

/** Per-level aggregate progress across every practicable section, for the level selector. */
export interface ExamLevelSummaryResponse {
    level: string;
    total: number;
    mastered: number;
    avgScore: number;
}

export interface ExamExerciseManualRequest {
    title: string;
    section: ExamSection;
    taskType: ExamTaskType | null;
    level: string | null;
    partNumber: number | null;
    passages: ExamPassage[];
    questions: ExamQuestion[];
    answerOptions: string[] | null;
    /** Optional admin-edited labels ("a", "1", ...) per answerOptions entry, by index; blank = default letter. */
    answerOptionLabels: string[] | null;
    defaultExplanation: string | null;
    defaultCommonMistake: string | null;
    teilDescription: string | null;
    modelSolution: string | null;
    requiresPlanning?: boolean;
    leitpunkte?: string[] | null;
    published: boolean;
}

// ---- Attempts ----

export interface StartExamAttemptResponse {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[] | null;
    /** Optional admin-edited labels ("a", "1", ...) per answerOptions entry, by index; blank = default letter. */
    answerOptionLabels: string[] | null;
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
    transcript: string | null;
}

export interface ExamAnswerRecord {
    questionId: string;
    answer: string;
    correct: boolean;
    explanation: string;
    commonMistake: string;
    transcript: string | null;
}

export type CompleteExamAttemptRequest = Record<string, never>;

export interface ExamTranscript {
    label: string | null;
    transcript: string;
}

export interface ExamAttemptResultResponse {
    attemptId: string;
    score: number;
    answerBreakdown: ExamAnswerRecord[];
    /** Every audio transcript of the exercise, revealed once the attempt is complete. */
    transcripts: ExamTranscript[];
}
