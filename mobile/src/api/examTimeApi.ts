import type { ExamSection } from '@/types/exam';
import type {
  ExamExerciseLastTime,
  ExamPracticeSession,
  ExamPracticeSessionResult,
  ExamPracticeSessionStartRequest,
  ExamTimeConfiguration,
  ExamTimeManagementRow,
} from '@/types/examTime';
import { api } from './client';

export const examTimeApi = {
  /** Enabled Teil targets for a level; an empty list means timing is not available for it. */
  configurations: (level: string) =>
    api.get<ExamTimeConfiguration[]>('/exam-time-configurations', { level }),
  startSession: (request: ExamPracticeSessionStartRequest) =>
    api.post<ExamPracticeSession>('/exam/practice-sessions', request),
  completeSession: (id: string, pausedSeconds: number) =>
    api.post<ExamPracticeSessionResult>(`/exam/practice-sessions/${id}/complete`, { pausedSeconds }),
  timeManagement: (level: string) =>
    api.get<ExamTimeManagementRow[]>('/exam/practice-sessions/time-management', { level }),
  lastTimes: (section: ExamSection, level: string) =>
    api.get<ExamExerciseLastTime[]>('/exam/practice-sessions/last-times', { section, level }),
};
