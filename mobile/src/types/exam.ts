export type ExamSection =
  | 'LESEVERSTEHEN'
  | 'SPRACHBAUSTEINE'
  | 'HOERVERSTEHEN'
  | 'SCHRIFTLICHER_AUSDRUCK'
  | 'TESTFORMAT_INFORMATION';

export type ExamTaskType =
  | 'MATCHING'
  | 'SITUATION_MATCHING'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE_NOT_GIVEN'
  | 'WORD_BANK_CLOZE'
  | 'WRITING_TASK';

export interface ExamPassagePublic {
  id: string;
  label: string;
  /** Markdown / editor HTML. Sprachbausteine gaps are `<span data-exam-gap="N">N</span>`. */
  content: string;
  imageUrl: string | null;
  /** Relative "/uploads/exam-audio/..." URL for Hörverstehen clips. */
  audioUrl: string | null;
}

export interface ExamQuestionPublic {
  id: string;
  taskType: ExamTaskType;
  prompt: string;
  /** Index into the exercise's passages (MATCHING / TRUE_FALSE_NOT_GIVEN / Hören clips). */
  sectionIndex: number | null;
  options: string[] | null;
  gapNumber: number | null;
  /** Exam numbering shown instead of 1, 2, 3 … ; null falls back to the position. */
  questionNumber: number | null;
}

export interface ExamExercise {
  id: string;
  title: string;
  section: ExamSection;
  /** Null for TESTFORMAT_INFORMATION, which has no quiz. */
  taskType: ExamTaskType | null;
  level: string | null;
  partNumber: number | null;
  teil: number | null;
  passages: ExamPassagePublic[];
  questions: ExamQuestionPublic[];
  answerOptions: string[] | null;
  answerOptionLabels: string[] | null;
  teilDescription: string | null;
  modelSolution: string | null;
  requiresPlanning: boolean;
  leitpunkte: string[] | null;
  defaultExplanation: string | null;
  defaultCommonMistake: string | null;
  completed: boolean;
  lastScore: number | null;
  bookmarked: boolean;
}

/** Lightweight list row (no passages/questions). */
export interface ExamExerciseSummary {
  id: string;
  title: string;
  section: ExamSection;
  taskType: ExamTaskType | null;
  level: string | null;
  partNumber: number | null;
  teil: number | null;
  teilDescription: string | null;
  questionsCount: number;
  completed: boolean;
  lastScore: number | null;
  bookmarked: boolean;
}

export interface ExamPendingBookmark {
  id: string;
  title: string;
  section: ExamSection;
  level: string | null;
  bookmarkedAt: string;
}

export interface ExamLevelSummary {
  level: string;
  total: number;
  mastered: number;
  avgScore: number;
}

export interface StartExamAttemptResponse {
  attemptId: string;
  passages: ExamPassagePublic[];
  questions: ExamQuestionPublic[];
  answerOptions: string[] | null;
  answerOptionLabels: string[] | null;
}

export interface ExamAnswerFeedback {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  commonMistake: string;
  transcript: string | null;
}

export interface ExamTranscript {
  label: string | null;
  transcript: string;
}

export interface ExamAttemptResult {
  attemptId: string;
  score: number;
  transcripts: ExamTranscript[];
}
