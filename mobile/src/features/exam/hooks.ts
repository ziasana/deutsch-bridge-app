import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examApi, examAttemptApi } from '@/api/examApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
import type { ExamExercise } from '@/types/exam';

export const examKeys = {
  summary: ['exam', 'level-summary'] as const,
  exercisesRoot: ['exam', 'exercises'] as const,
  exercises: (level: string) => ['exam', 'exercises', level] as const,
  exercise: (id: string) => ['exam', 'exercise', id] as const,
  pending: ['exam', 'pending-bookmarks'] as const,
};

export const useExamLevelSummary = () =>
  useQuery({ queryKey: examKeys.summary, queryFn: examApi.levelSummary, staleTime: 60_000 });

/** All sections at one level, cached per level; switching section needs no new fetch. */
export const useExamExercises = (level: string | null) =>
  useQuery({
    queryKey: examKeys.exercises(level ?? ''),
    queryFn: () => examApi.exercisesForLevel(level!),
    enabled: !!level,
    staleTime: 60_000,
  });

export const useExamExercise = (id: string) =>
  useQuery({
    queryKey: examKeys.exercise(id),
    queryFn: () => examApi.byId(id),
    enabled: !!id,
    staleTime: 60_000,
  });

export const usePendingExamBookmarks = () =>
  useQuery({ queryKey: examKeys.pending, queryFn: examApi.pendingBookmarks, staleTime: 60_000 });

export function useToggleExamBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookmarked }: { id: string; bookmarked: boolean }) =>
      bookmarked ? examApi.removeBookmark(id) : examApi.addBookmark(id),
    onSuccess: (summary, { id }) => {
      queryClient.setQueryData<ExamExercise>(examKeys.exercise(id), (e) =>
        e ? { ...e, bookmarked: summary.bookmarked } : e,
      );
      void queryClient.invalidateQueries({ queryKey: examKeys.exercisesRoot });
      void queryClient.invalidateQueries({ queryKey: examKeys.pending });
    },
  });
}

export const useStartExamAttempt = () =>
  useMutation({ mutationFn: (exerciseId: string) => examAttemptApi.start(exerciseId) });

export const useSubmitExamAnswer = (attemptId: string) =>
  useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) =>
      examAttemptApi.answer(attemptId, questionId, answer),
  });

function useRefreshExamProgress() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: examKeys.summary });
    void queryClient.invalidateQueries({ queryKey: examKeys.exercisesRoot });
    void queryClient.invalidateQueries({ queryKey: examKeys.pending });
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
  };
}

export function useCompleteExamAttempt(attemptId: string, exerciseId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshExamProgress();
  return useMutation({
    mutationFn: () => examAttemptApi.complete(attemptId),
    onSuccess: (result) => {
      queryClient.setQueryData<ExamExercise>(examKeys.exercise(exerciseId), (e) =>
        e ? { ...e, lastScore: result.score } : e,
      );
      refresh();
    },
  });
}

/** Finishing an attempt (or reading Testformat info) counts as completing the exercise. */
export function useMarkExamCompleted(exerciseId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshExamProgress();
  return useMutation({
    mutationFn: () => examApi.markCompleted(exerciseId),
    onSuccess: () => {
      queryClient.setQueryData<ExamExercise>(examKeys.exercise(exerciseId), (e) =>
        e ? { ...e, completed: true } : e,
      );
      refresh();
    },
  });
}
