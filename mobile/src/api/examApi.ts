import type {
  ExamAnswerFeedback,
  ExamAttemptResult,
  ExamExercise,
  ExamExerciseSummary,
  ExamLevelSummary,
  ExamPendingBookmark,
  StartExamAttemptResponse,
} from '@/types/exam';
import { api } from './client';

export const examApi = {
  levelSummary: () => api.get<ExamLevelSummary[]>('/exam/level-summary'),
  /** Every section at one level - small enough to load whole (the backend has no paging here). */
  exercisesForLevel: (level: string) => api.get<ExamExerciseSummary[]>('/exam', { level }),
  byId: (id: string) => api.get<ExamExercise>(`/exam/${id}`),
  pendingBookmarks: () => api.get<ExamPendingBookmark[]>('/exam/bookmarks/pending'),
  addBookmark: (id: string) => api.post<ExamExerciseSummary>(`/exam/${id}/bookmark`),
  removeBookmark: (id: string) => api.delete<ExamExerciseSummary>(`/exam/${id}/bookmark`),
  markCompleted: (id: string) => api.post<void>(`/exam/${id}/mark-completed`),
};

export const examAttemptApi = {
  start: (exerciseId: string) => api.post<StartExamAttemptResponse>(`/exam/${exerciseId}/attempts`),
  answer: (attemptId: string, questionId: string, answer: string) =>
    api.post<ExamAnswerFeedback>(`/exam/attempts/${attemptId}/answers`, { questionId, answer }),
  complete: (attemptId: string) =>
    api.post<ExamAttemptResult>(`/exam/attempts/${attemptId}/complete`, {}),
};
