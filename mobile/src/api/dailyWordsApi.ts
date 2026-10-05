import type { DailyWord } from '@/types/dailyWord';
import { api } from './client';

export const dailyWordsApi = {
  getToday: () => api.get<DailyWord[]>('/daily-words'),

  // Same endpoint the web app uses to record that a word was learned.
  markLearned: (dailyWordId: string) =>
    api.post<unknown>('/learning-progress', { dailyWordId, learned: true }),
};
