import type {
  Redemittel,
  RedemittelAnswer,
  RedemittelHub,
  RedemittelListParams,
  RedemittelPage,
  RedemittelSession,
} from '@/types/redemittel';
import { api } from './client';

export const redemittelApi = {
  /** Counts, today's quota and the categories: never loads a Redemittel itself. */
  hub: () => api.get<RedemittelHub>('/redemittel/hub'),
  /** Zero-based page; empty filters are omitted. */
  page: (page: number, size: number, p: RedemittelListParams = {}) =>
    api.get<RedemittelPage>('/redemittel', {
      page,
      size,
      level: p.level || undefined,
      category: p.category || undefined,
      search: p.search || undefined,
      status: p.status || undefined,
      saved: p.saved || undefined,
    }),
  byId: (id: string) => api.get<Redemittel>(`/redemittel/${encodeURIComponent(id)}`),
  today: () => api.get<Redemittel[]>('/redemittel/today'),
  reviewSession: (limit = 10) => api.get<RedemittelSession>('/redemittel/review', { limit }),
  /** Practice over learned Redemittel: the given ids, or the ones practised least recently. */
  practiceSession: (ids?: string[], size = 10) =>
    api.get<RedemittelSession>('/redemittel/practice', {
      ids: ids && ids.length > 0 ? ids.join(',') : undefined,
      size,
    }),
  learn: (id: string) => api.post<Redemittel>(`/redemittel/${encodeURIComponent(id)}/learn`),
  save: (id: string) => api.post<Redemittel>(`/redemittel/${encodeURIComponent(id)}/save`),
  unsave: (id: string) => api.delete<Redemittel>(`/redemittel/${encodeURIComponent(id)}/save`),
  answerPractice: (id: string, exerciseId: string, answer: string) =>
    api.post<RedemittelAnswer>(`/redemittel/${encodeURIComponent(id)}/practice`, {
      exerciseId,
      answer,
    }),
  answerReview: (id: string, exerciseId: string, answer: string) =>
    api.post<RedemittelAnswer>(`/redemittel/${encodeURIComponent(id)}/review`, {
      exerciseId,
      answer,
    }),
};
