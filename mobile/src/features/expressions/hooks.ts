import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { expressionApi, expressionPracticeApi } from '@/api/expressionApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
import type { Expression, ExpressionFilters, ExpressionType } from '@/types/expression';

export const PAGE_SIZE = 20;

export const expressionKeys = {
  summary: ['expressions', 'collection-summary'] as const,
  continueLearning: (type: ExpressionType) => ['expressions', 'continue-learning', type] as const,
  listRoot: ['expressions', 'list'] as const,
  list: (type: ExpressionType, f: ExpressionFilters) => ['expressions', 'list', type, f] as const,
  detail: (id: string) => ['expressions', 'detail', id] as const,
  navigation: (id: string) => ['expressions', 'navigation', id] as const,
};

export const useCollectionSummary = () =>
  useQuery({
    queryKey: expressionKeys.summary,
    queryFn: expressionApi.collectionSummary,
    staleTime: 5 * 60_000,
  });

export const useContinueLearning = (type: ExpressionType) =>
  useQuery({
    queryKey: expressionKeys.continueLearning(type),
    queryFn: () => expressionApi.continueLearning(type),
    staleTime: 60_000,
  });

/** Infinite, server-paged list; filters are part of the key so each combination is cached separately. */
export const useExpressionList = (type: ExpressionType, filters: ExpressionFilters) =>
  useInfiniteQuery({
    queryKey: expressionKeys.list(type, filters),
    queryFn: ({ pageParam }) => expressionApi.page(type, pageParam, PAGE_SIZE, filters),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export const useExpression = (id: string) =>
  useQuery({
    queryKey: expressionKeys.detail(id),
    queryFn: () => expressionApi.byId(id),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useExpressionNavigation = (id: string) =>
  useQuery({
    queryKey: expressionKeys.navigation(id),
    queryFn: () => expressionApi.navigation(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

/** Opening an expression counts as seeing it (updates progress server-side); fire once per id. */
export function useMarkViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expressionApi.markViewed(id),
    onSuccess: (expression) => {
      queryClient.setQueryData<Expression>(expressionKeys.detail(expression.id), expression);
      void queryClient.invalidateQueries({ queryKey: expressionKeys.listRoot });
    },
  });
}

export function useToggleExpressionBookmark(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookmarked: boolean) =>
      bookmarked ? expressionApi.removeBookmark(id) : expressionApi.addBookmark(id),
    onSuccess: (_e, wasBookmarked) => {
      queryClient.setQueryData<Expression>(expressionKeys.detail(id), (e) =>
        e ? { ...e, bookmarked: !wasBookmarked } : e,
      );
      void queryClient.invalidateQueries({ queryKey: expressionKeys.listRoot });
    },
  });
}

/** A fresh server-picked set (new + due expressions); never cached. */
export const usePracticeSession = (expressionId?: string) =>
  useQuery({
    queryKey: ['expressions', 'practice-session', expressionId ?? 'all'],
    queryFn: () => expressionPracticeApi.session(expressionId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

/** Every answered step changes mastery, review counts and the dashboard focus/review numbers. */
function useRefreshAfterAnswer() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    void queryClient.invalidateQueries({ queryKey: ['expressions', 'continue-learning'] });
  };
}

export function useRecallAnswer(expressionId: string) {
  const refresh = useRefreshAfterAnswer();
  return useMutation({
    mutationFn: (answer: string) => expressionPracticeApi.recall(expressionId, answer),
    onSuccess: refresh,
  });
}

export function useQuestionAnswer(expressionId: string) {
  const refresh = useRefreshAfterAnswer();
  return useMutation({
    mutationFn: ({ questionId, optionId }: { questionId: string; optionId: string }) =>
      expressionPracticeApi.question(expressionId, questionId, optionId),
    onSuccess: refresh,
  });
}

export function useTransformationAnswer(expressionId: string) {
  const refresh = useRefreshAfterAnswer();
  return useMutation({
    mutationFn: ({ questionId, sentence }: { questionId: string; sentence: string }) =>
      expressionPracticeApi.transformation(expressionId, questionId, sentence),
    onSuccess: refresh,
  });
}

export function useProductionAnswer(expressionId: string) {
  const refresh = useRefreshAfterAnswer();
  return useMutation({
    mutationFn: (sentence: string) => expressionPracticeApi.production(expressionId, sentence),
    onSuccess: refresh,
  });
}
