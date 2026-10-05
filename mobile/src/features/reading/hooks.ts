import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { lexiconApi, readingApi, readingQuizApi, type ReadingListParams } from '@/api/readingApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
import type { ReadingArticle } from '@/types/reading';

export const READING_PAGE_SIZE = 10;

export const readingKeys = {
  summary: ['reading', 'level-summary'] as const,
  categories: ['reading', 'categories'] as const,
  listRoot: ['reading', 'list'] as const,
  list: (p: ReadingListParams) => ['reading', 'list', p] as const,
  article: (id: string) => ['reading', 'article', id] as const,
  navigation: (id: string) => ['reading', 'navigation', id] as const,
};

export const useReadingLevelSummary = () =>
  useQuery({ queryKey: readingKeys.summary, queryFn: readingApi.levelSummary, staleTime: 60_000 });

export const useReadingCategories = () =>
  useQuery({
    queryKey: readingKeys.categories,
    queryFn: readingApi.categories,
    staleTime: 10 * 60_000,
  });

export const useReadingList = (params: ReadingListParams | null) =>
  useInfiniteQuery({
    queryKey: readingKeys.list(
      params ?? { level: '', search: '', bookmarked: false, categoryId: '' },
    ),
    queryFn: ({ pageParam }) => readingApi.page(params!, pageParam, READING_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    enabled: !!params,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export const useReadingArticle = (id: string) =>
  useQuery({
    queryKey: readingKeys.article(id),
    queryFn: () => readingApi.article(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

export const useReadingNavigation = (id: string) =>
  useQuery({
    queryKey: readingKeys.navigation(id),
    queryFn: () => readingApi.navigation(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

/** Views are counted on every open, separate from the cacheable article fetch; failures are cosmetic. */
export const useRecordView = () =>
  useMutation({ mutationFn: (id: string) => readingApi.recordView(id) });

function refreshOverviews(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: readingKeys.summary });
  void queryClient.invalidateQueries({ queryKey: readingKeys.listRoot });
  void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
}

export function useSetArticleLearned(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (learned: boolean) => readingApi.setLearned(id, learned),
    onSuccess: (_d, learned) => {
      queryClient.setQueryData<ReadingArticle>(readingKeys.article(id), (a) =>
        a ? { ...a, learningProgresses: [{ id: 'local', learned }] } : a,
      );
      refreshOverviews(queryClient);
    },
  });
}

export function useToggleArticleBookmark(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookmarked: boolean) =>
      bookmarked ? readingApi.removeBookmark(id) : readingApi.addBookmark(id),
    onSuccess: (article) => {
      queryClient.setQueryData<ReadingArticle>(readingKeys.article(id), article);
      void queryClient.invalidateQueries({ queryKey: readingKeys.listRoot });
    },
  });
}

export const useSaveToLexicon = () => useMutation({ mutationFn: lexiconApi.save });

/** Dictionary entry for a tapped word; one cached lookup per lemma. */
export const useDictionaryEntry = (lemma: string | null) =>
  useQuery({
    queryKey: ['dictionary', lemma],
    queryFn: () => lexiconApi.lookup(lemma!),
    enabled: !!lemma,
    staleTime: 10 * 60_000,
    retry: false,
  });

export const useStartQuiz = () =>
  useMutation({ mutationFn: (articleId: string) => readingQuizApi.start(articleId) });

export const useSubmitQuizAnswer = (attemptId: string) =>
  useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) =>
      readingQuizApi.answer(attemptId, questionId, answer),
  });

export function useCompleteQuiz(attemptId: string, articleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tapped, saved }: { tapped: string[]; saved: string[] }) =>
      readingQuizApi.complete(attemptId, tapped, saved),
    onSuccess: () => {
      queryClient.setQueryData<ReadingArticle>(readingKeys.article(articleId), (a) =>
        a ? { ...a, quizCompleted: true } : a,
      );
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
