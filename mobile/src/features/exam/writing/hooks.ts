import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { writingApi } from '@/api/writingApi';
import type { WritingAttempt, WritingAttemptRequest } from '@/types/writing';

export const writingKeys = {
  attempts: (exerciseId: string) => ['writing', 'attempts', exerciseId] as const,
  learn: (level: string | null) => ['writing', 'learn', level] as const,
};

export const useWritingAttempts = (exerciseId: string) =>
  useQuery({
    queryKey: writingKeys.attempts(exerciseId),
    queryFn: () => writingApi.attempts(exerciseId),
  });

/** Help content for a level; only fetched once the learner opens the help sheet. */
export const useWritingLearning = (level: string | null, enabled: boolean) =>
  useQuery({
    queryKey: writingKeys.learn(level),
    queryFn: () => writingApi.learning(level!),
    enabled: !!level && enabled,
    staleTime: 10 * 60_000,
  });

export function useSubmitWriting(exerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: WritingAttemptRequest) => writingApi.submit(request),
    onSuccess: (attempt) =>
      queryClient.setQueryData<WritingAttempt[]>(writingKeys.attempts(exerciseId), (old = []) => [
        ...old,
        attempt,
      ]),
  });
}

export function useRequestAiFeedback(exerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => writingApi.aiFeedback(attemptId),
    onSuccess: (updated) =>
      queryClient.setQueryData<WritingAttempt[]>(writingKeys.attempts(exerciseId), (old = []) =>
        old.map((a) => (a.id === updated.id ? updated : a)),
      ),
  });
}
