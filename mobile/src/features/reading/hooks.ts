import { useEffect } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { lexiconApi, readingApi, readingQuizApi, type ReadingListParams } from '@/api/readingApi';
import { vocabularyApi } from '@/api/vocabularyApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
import { CONTENT_STALE_MS } from '@/api/queryClient';
import { deliverOrQueue, loadItem } from '@/features/downloads/offline';
import type { DictionaryEntry, ReadingArticle } from '@/types/reading';

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
    staleTime: 60 * 60_000,
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

const articleOptions = (id: string) => ({
  queryKey: readingKeys.article(id),
  queryFn: () => loadItem('reading', id, () => readingApi.article(id)),
  staleTime: CONTENT_STALE_MS,
});

export const useReadingArticle = (id: string) => useQuery({ ...articleOptions(id), enabled: !!id });

/** Warms the cache with the neighbouring articles so "next" / "previous" open instantly. */
export function usePrefetchNeighbourArticles(neighbours: (string | undefined)[]): void {
  const queryClient = useQueryClient();
  const key = neighbours.filter(Boolean).join(',');
  useEffect(() => {
    for (const id of key ? key.split(',') : []) void queryClient.prefetchQuery(articleOptions(id));
  }, [key, queryClient]);
}

export const useReadingNavigation = (id: string) =>
  useQuery({
    queryKey: readingKeys.navigation(id),
    queryFn: () => readingApi.navigation(id),
    enabled: !!id,
    staleTime: CONTENT_STALE_MS,
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
    mutationFn: (learned: boolean) =>
      deliverOrQueue({ field: 'learned', kind: 'reading', id, value: learned }, () =>
        readingApi.setLearned(id, learned),
      ),
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
      deliverOrQueue({ field: 'bookmarked', kind: 'reading', id, value: !bookmarked }, () =>
        bookmarked ? readingApi.removeBookmark(id) : readingApi.addBookmark(id),
      ),
    onSuccess: (article, wasBookmarked) => {
      // Queued offline (no server answer): flip the flag locally instead.
      queryClient.setQueryData<ReadingArticle>(
        readingKeys.article(id),
        (a) => article ?? (a ? { ...a, bookmarked: !wasBookmarked } : a),
      );
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

/**
 * Adds a dictionary entry to the learner's vocabulary, or removes it again. Like the web app,
 * unsaving looks up the vocabulary item created from this entry and deletes it by its own id.
 */
export function useToggleDictionarySave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entry }: { entry: DictionaryEntry; lookupKey: string }) => {
      if (!entry.savedByCurrentUser) {
        await vocabularyApi.addFromDictionary(entry.id);
        return;
      }
      const items = await vocabularyApi.listFromDictionary();
      const match = items.find((i) => i.dictionaryEntryId === entry.id);
      if (match) await vocabularyApi.remove(match.id);
    },
    onSuccess: (_void, { entry, lookupKey }) => {
      // The entry is cached under the word that was tapped, which can differ from its lemma.
      queryClient.setQueryData<DictionaryEntry>(['dictionary', lookupKey], {
        ...entry,
        savedByCurrentUser: !entry.savedByCurrentUser,
      });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      void queryClient.invalidateQueries({ queryKey: ['vocabulary-practice-session'] });
    },
  });
}

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
