import { ExamSection } from "./exam";

export type ExamTimeMode = "PRACTICE" | "TIME_TRAINING";
export type ExamPracticeScope = "EXERCISE" | "TEIL";

/** Learner-facing recommended time for one Teil. */
export interface ExamTimeConfiguration {
    examType: string;
    level: string;
    section: ExamSection;
    teil: number;
    recommendedMinutes: number;
}

/** One Teil row of the admin settings; id/recommendedMinutes are null until first configured. */
export interface ExamTimeEntry {
    id: string | null;
    section: ExamSection;
    teil: number;
    recommendedMinutes: number | null;
    enabled: boolean;
}

export interface ExamTimeSettings {
    examType: string;
    level: string;
    totalDurationMinutes: number | null;
    configuredMinutes: number;
    reviewMinutes: number | null;
    minMinutes: number;
    maxMinutes: number;
    maxTotalMinutes: number;
    entries: ExamTimeEntry[];
}

export interface ExamTimeBulkUpdateRequest {
    level: string;
    totalDurationMinutes?: number | null;
    configurations: { section: ExamSection; teil: number; recommendedMinutes: number; enabled: boolean }[];
}

export interface ExamPracticeSession {
    id: string;
    scope: ExamPracticeScope;
    mode: ExamTimeMode;
    section: ExamSection;
    level: string | null;
    teil: number | null;
    exerciseId: string | null;
    startedAt: string;
    targetSeconds: number | null;
}

export interface ExamPracticeSessionStartRequest {
    scope: ExamPracticeScope;
    mode: ExamTimeMode;
    exerciseId?: string;
    section?: ExamSection;
    level?: string;
    teil?: number;
}

export interface ExamPracticeSessionResult {
    id: string;
    scope: ExamPracticeScope;
    mode: ExamTimeMode;
    section: ExamSection;
    level: string | null;
    teil: number | null;
    elapsedSeconds: number;
    targetSeconds: number | null;
    differenceSeconds: number | null;
    questionsTotal: number;
    questionsAnswered: number;
    correctAnswers: number;
    score: number | null;
}

export interface ExamTimeWeekSummary {
    timedExercisesThisWeek: number;
}

/** The learner's average finished time for one Teil, next to today's recommended time. */
export interface ExamTimeManagementRow {
    section: ExamSection;
    teil: number;
    sessions: number;
    averageSeconds: number;
    targetSeconds: number | null;
    differenceSeconds: number | null;
}

/** The learner's last finished time for one exercise. */
export interface ExamExerciseLastTime {
    exerciseId: string;
    elapsedSeconds: number;
    targetSeconds: number | null;
}
