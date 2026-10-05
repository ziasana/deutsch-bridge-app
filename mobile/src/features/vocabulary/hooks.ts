import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vocabularyPracticeApi } from '@/api/vocabularyApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
import type { VocabularyRoundRequest } from '@/types/vocabulary';

export const PRACTICE_SESSION_KEY = ['vocabulary-practice-session'] as const;

/** A session is a fresh, server-picked set (new + due words); never serve a cached one. */
export function usePracticeSession(vocabularyItemId?: string) {
  return useQuery({
    queryKey: [...PRACTICE_SESSION_KEY, vocabularyItemId ?? 'all'],
    queryFn: () => vocabularyPracticeApi.getSession(vocabularyItemId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

export function useSubmitRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: VocabularyRoundRequest) => vocabularyPracticeApi.submitRound(request),
    // Review counts and the plan on the dashboard change with every round.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
  });
}
