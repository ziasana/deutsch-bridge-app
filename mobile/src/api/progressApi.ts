import type { ProgressOverview, ProgressStats } from '@/types/progress';
import { api } from './client';

export const progressApi = {
  overview: () => api.get<ProgressOverview>('/learning-progress/overview'),
  stats: () => api.get<ProgressStats>('/learning-progress/stats'),
};
