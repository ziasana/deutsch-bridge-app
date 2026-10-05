import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { exerciseProgressApi, grammarApi } from '@/api/grammarApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
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

export const useLesson = (id: string) =>
  useQuery({
    queryKey: grammarKeys.lesson(id),
    queryFn: () => grammarApi.lesson(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

export const useLessonNavigation = (id: string) =>
  useQuery({
    queryKey: grammarKeys.navigation(id),
    queryFn: () => grammarApi.navigation(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
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
    mutationFn: (learned: boolean) => grammarApi.setLearned(lessonId, learned),
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
      bookmarked ? grammarApi.removeBookmark(lessonId) : grammarApi.addBookmark(lessonId),
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
