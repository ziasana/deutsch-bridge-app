import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyWordsApi } from '@/api/dailyWordsApi';
import { vocabularyApi } from '@/api/vocabularyApi';
import { ApiError } from '@/api/errors';
import type { DailyWord } from '@/types/dailyWord';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';

export const DAILY_WORDS_KEY = ['daily-words'] as const;

export function useDailyWords() {
  return useQuery({ queryKey: DAILY_WORDS_KEY, queryFn: dailyWordsApi.getToday, staleTime: 5 * 60_000 });
}

/** Marks a word learned, updates the cached list, and refreshes the dashboard's plan/progress. */
export function useMarkWordLearned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (word: DailyWord) => dailyWordsApi.markLearned(word.id),
    onSuccess: (_data, word) => {
      queryClient.setQueryData<DailyWord[]>(DAILY_WORDS_KEY, (words) =>
        words?.map((w) => (w.id === word.id ? { ...w, learned: true } : w)),
      );
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useVocabularyExists(word: string) {
  return useQuery({
    queryKey: ['vocabulary-exists', word],
    queryFn: () => vocabularyApi.exists(word),
    enabled: word.length > 0,
    staleTime: 60_000,
  });
}

export function useSaveToVocabulary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (word: DailyWord) => {
      try {
        await vocabularyApi.create({
          word: word.word,
          article: null,
          meaning: word.meaning,
          example: word.example,
          language: 'EN',
          level: null,
        });
      } catch (error) {
        // Saved earlier (e.g. on web): the backend answers "already exists" — that is the goal state.
        if (!(error instanceof ApiError && /already exists/i.test(error.message))) throw error;
      }
    },
    onSuccess: (_d, word) => {
      queryClient.setQueryData(['vocabulary-exists', word.word], { exists: true, vocabularyItemId: null });
    },
  });
}
