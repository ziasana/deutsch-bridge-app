import type {
  AnswerItem,
  AttemptState,
  AttemptSummary,
  AudioPlayResponse,
  HistoryResponse,
  ProfileOverview,
  ResultResponse,
  SaveAnswersResponse,
} from '@/types/examSimulation';
import { api } from './client';

const base = '/exam-simulation';

export const examSimulationApi = {
  profiles: () => api.get<ProfileOverview[]>(`${base}/profiles`),
  history: () => api.get<HistoryResponse>(`${base}/attempts`),
  start: (profileId: string) => api.post<AttemptState>(`${base}/attempts`, { profileId }),
  attempt: (id: string) => api.get<AttemptState>(`${base}/attempts/${id}`),
  /** Re-enters a running attempt (app restart, other device). */
  resume: (id: string) => api.post<AttemptState>(`${base}/attempts/${id}/resume`),
  pause: (id: string) => api.post<AttemptState>(`${base}/attempts/${id}/pause`),
  continue: (id: string) => api.post<AttemptState>(`${base}/attempts/${id}/continue`),
  /** Idempotent upsert, safe to retry. */
  saveAnswers: (id: string, answers: AnswerItem[]) =>
    api.put<SaveAnswersResponse>(`${base}/attempts/${id}/answers`, { answers }),
  completeSection: (id: string) =>
    api.post<AttemptState>(`${base}/attempts/${id}/sections/current/complete`),
  submit: (id: string) => api.post<ResultResponse>(`${base}/attempts/${id}/submit`),
  cancel: (id: string) => api.post<AttemptSummary>(`${base}/attempts/${id}/cancel`),
  result: (id: string) => api.get<ResultResponse>(`${base}/attempts/${id}/result`),
  /** Counts one play on the server; the clip may only start after this succeeds. */
  playAudio: (id: string, partKey: string, passageId: string) =>
    api.post<AudioPlayResponse>(`${base}/attempts/${id}/parts/${partKey}/audio/${passageId}/play`),
};
