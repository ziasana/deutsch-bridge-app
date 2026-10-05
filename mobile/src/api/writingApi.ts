import type {
  WritingAttempt,
  WritingAttemptRequest,
  WritingLearningResponse,
} from '@/types/writing';
import { api } from './client';

export const writingApi = {
  learning: (level: string) => api.get<WritingLearningResponse>('/writing/learn', { level }),
  attempts: (exerciseId: string) => api.get<WritingAttempt[]>('/writing/attempts', { exerciseId }),
  submit: (request: WritingAttemptRequest) => api.post<WritingAttempt>('/writing/attempts', request),
  /** Optional AI feedback; counts against the daily AI limit (429) and is stored after the first call. */
  aiFeedback: (attemptId: string) =>
    api.postAi<WritingAttempt>(`/writing/attempts/${attemptId}/ai-feedback`),
};
