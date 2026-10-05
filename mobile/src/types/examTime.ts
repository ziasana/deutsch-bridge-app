import type { ExamSection } from './exam';

export type ExamTimeMode = 'PRACTICE' | 'TIME_TRAINING';
export type ExamPracticeScope = 'EXERCISE' | 'TEIL';

/** Recommended time for one Teil. */
export interface ExamTimeConfiguration {
  examType: string;
  level: string;
  section: ExamSection;
  teil: number;
  recommendedMinutes: number;
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

/** The learner's average finished time for one Teil next to today's recommended time. */
export interface ExamTimeManagementRow {
  section: ExamSection;
  teil: number;
  sessions: number;
  averageSeconds: number;
  targetSeconds: number | null;
  differenceSeconds: number | null;
}

export interface ExamExerciseLastTime {
  exerciseId: string;
  elapsedSeconds: number;
  targetSeconds: number | null;
}
