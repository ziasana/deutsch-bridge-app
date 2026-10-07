import type {
  WritingAttempt,
  WritingAttemptRequest,
  WritingLearningResponse,
  WritingStationProgress,
} from '@/types/writing';
import { api } from './client';

export const writingApi = {
  learning: (level: string) => api.get<WritingLearningResponse>('/writing/learn', { level }),
  learnProgress: (level: string) =>
    api.get<WritingStationProgress[]>('/writing/learn-progress', { level }),
  saveLearnProgress: (level: string, station: string, correct: number, total: number) =>
    api.put<WritingStationProgress>(
      `/writing/learn-progress/${station}?level=${encodeURIComponent(level)}`,
      { station, correct, total },
    ),
  resetLearnProgress: (level: string) =>
    api.delete<void>(`/writing/learn-progress?level=${encodeURIComponent(level)}`),
  attempts: (exerciseId: string) => api.get<WritingAttempt[]>('/writing/attempts', { exerciseId }),
  submit: (request: WritingAttemptRequest) =>
    api.post<WritingAttempt>('/writing/attempts', request),
  /** Optional AI feedback; counts against the daily AI limit (429) and is stored after the first call. */
  aiFeedback: (attemptId: string) =>
    api.postAi<WritingAttempt>(`/writing/attempts/${attemptId}/ai-feedback`),
};
