import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { exerciseProgressApi, grammarApi } from '@/api/grammarApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
import { CONTENT_STALE_MS } from '@/api/queryClient';
import { deliverOrQueue, loadItem } from '@/features/downloads/offline';
import type {
  CategoryTestStatus,
  ExerciseAnswer,
  GrammarCategoryWithLessons,
  GrammarLesson,
} from '@/types/grammar';

export const grammarKeys = {
  summary: ['grammar', 'level-summary'] as const,
  levelRoot: ['grammar', 'level'] as const,
  level: (level: string) => ['grammar', 'level', level] as const,
  lesson: (id: string) => ['grammar', 'lesson', id] as const,
  navigation: (id: string) => ['grammar', 'navigation', id] as const,
  category: (id: string) => ['grammar', 'category', id] as const,
  exercises: ['exercise-progress'] as const,
};

export const useLevelSummary = () =>
  useQuery({ queryKey: grammarKeys.summary, queryFn: grammarApi.levelSummary, staleTime: 60_000 });

export const useLevelView = (level: string | null) =>
  useQuery({
    queryKey: grammarKeys.level(level ?? ''),
    queryFn: () => grammarApi.levelView(level!),
    enabled: !!level,
    staleTime: 60_000,
  });

const lessonOptions = (id: string) => ({
  queryKey: grammarKeys.lesson(id),
  queryFn: () => loadItem('grammar', id, () => grammarApi.lesson(id)),
  // Lesson text rarely changes, and learned/bookmark changes update this entry directly.
  staleTime: CONTENT_STALE_MS,
});

export const useLesson = (id: string) => useQuery({ ...lessonOptions(id), enabled: !!id });

/** Warms the cache with the neighbouring lessons so "next" / "previous" open instantly. */
export function usePrefetchNeighbourLessons(neighbours: (string | undefined)[]): void {
  const queryClient = useQueryClient();
  const key = neighbours.filter(Boolean).join(',');
  useEffect(() => {
    for (const id of key ? key.split(',') : []) void queryClient.prefetchQuery(lessonOptions(id));
  }, [key, queryClient]);
}

export const useLessonNavigation = (id: string) =>
  useQuery({
    queryKey: grammarKeys.navigation(id),
    queryFn: () => grammarApi.navigation(id),
    enabled: !!id,
    staleTime: CONTENT_STALE_MS,
  });

export const useCategory = (id: string) =>
  useQuery({
    queryKey: grammarKeys.category(id),
    queryFn: () => grammarApi.category(id),
    enabled: !!id,
    staleTime: 60_000,
  });

/** Lists/levels/dashboard show learned counts and bookmarks, so refresh them after a change. */
function refreshOverviews(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: grammarKeys.levelRoot });
  void queryClient.invalidateQueries({ queryKey: grammarKeys.summary });
  void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
}

export function useSetLessonLearned(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (learned: boolean) =>
      deliverOrQueue({ field: 'learned', kind: 'grammar', id: lessonId, value: learned }, () =>
        grammarApi.setLearned(lessonId, learned),
      ),
    onSuccess: (_d, learned) => {
      queryClient.setQueryData<GrammarLesson>(grammarKeys.lesson(lessonId), (lesson) =>
        lesson ? { ...lesson, learningProgresses: [{ id: lessonId, learned }] } : lesson,
      );
      refreshOverviews(queryClient);
    },
  });
}

export function useToggleBookmark(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookmarked: boolean) =>
      deliverOrQueue(
        { field: 'bookmarked', kind: 'grammar', id: lessonId, value: !bookmarked },
        () => (bookmarked ? grammarApi.removeBookmark(lessonId) : grammarApi.addBookmark(lessonId)),
      ),
    onSuccess: (_lesson, wasBookmarked) => {
      queryClient.setQueryData<GrammarLesson>(grammarKeys.lesson(lessonId), (lesson) =>
        lesson ? { ...lesson, bookmarked: !wasBookmarked } : lesson,
      );
      void queryClient.invalidateQueries({ queryKey: grammarKeys.levelRoot });
    },
  });
}

/** Saved per-question results of every lesson quiz, keyed "<lessonId>:<questionIndex>". */
export const useExerciseProgress = () =>
  useQuery({
    queryKey: grammarKeys.exercises,
    queryFn: exerciseProgressApi.list,
    staleTime: 0,
    refetchOnMount: 'always',
  });

export function useSaveAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answer: ExerciseAnswer) => exerciseProgressApi.save(answer),
    onMutate: (answer) =>
      queryClient.setQueryData<ExerciseAnswer[]>(grammarKeys.exercises, (list = []) => [
        ...list.filter((a) => a.questionKey !== answer.questionKey),
        answer,
      ]),
  });
}

export function useResetAnswers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keys: string[]) => exerciseProgressApi.reset(keys),
    onSuccess: (_d, keys) =>
      queryClient.setQueryData<ExerciseAnswer[]>(grammarKeys.exercises, (list = []) =>
        list.filter((a) => !keys.includes(a.questionKey)),
      ),
  });
}

function patchCategoryStatus(queryClient: QueryClient, id: string, status: CategoryTestStatus) {
  queryClient.setQueryData<GrammarCategoryWithLessons>(grammarKeys.category(id), (c) =>
    c ? { ...c, testStatus: status } : c,
  );
  void queryClient.invalidateQueries({ queryKey: grammarKeys.levelRoot });
}

export function useSubmitCategoryTest(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ score, total }: { score: number; total: number }) =>
      grammarApi.submitCategoryTest(categoryId, score, total),
    onSuccess: (status) => patchCategoryStatus(queryClient, categoryId, status),
  });
}

export function useMarkCategoryComplete(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => grammarApi.markCategoryComplete(categoryId),
    onSuccess: (status) => patchCategoryStatus(queryClient, categoryId, status),
  });
}
