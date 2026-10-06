import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi } from '@/api/vocabularyApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
import type {
  VocabularyCreateRequest,
  VocabularyItem,
  VocabularyUpdateRequest,
} from '@/types/vocabulary';
import { PRACTICE_SESSION_KEY } from './hooks';

export const vocabularyKeys = {
  list: ['vocabulary', 'list'] as const,
  item: (id: string) => ['vocabulary', 'item', id] as const,
};

export const useVocabularyList = () =>
  useQuery({ queryKey: vocabularyKeys.list, queryFn: vocabularyApi.list });

export const useVocabularyItem = (id: string | undefined) =>
  useQuery({
    queryKey: vocabularyKeys.item(id ?? ''),
    queryFn: () => vocabularyApi.byId(id!),
    enabled: !!id,
  });

/** What changes whenever the list changes: the dashboard numbers and the next practice session. */
function useRefreshRelated() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    void queryClient.invalidateQueries({ queryKey: PRACTICE_SESSION_KEY });
  };
}

/** Writes one changed item into the list and detail caches. */
function useCacheItem() {
  const queryClient = useQueryClient();
  return (item: VocabularyItem) => {
    queryClient.setQueryData<VocabularyItem[]>(vocabularyKeys.list, (list) =>
      list?.some((i) => i.id === item.id)
        ? list.map((i) => (i.id === item.id ? item : i))
        : [item, ...(list ?? [])],
    );
    queryClient.setQueryData(vocabularyKeys.item(item.id), item);
  };
}

/** Adds a new word, or saves changes to an existing one. */
export function useSaveVocabulary(editId?: string) {
  const cache = useCacheItem();
  const refresh = useRefreshRelated();
  return useMutation({
    mutationFn: (input: VocabularyCreateRequest & VocabularyUpdateRequest) =>
      editId
        ? vocabularyApi.update(editId, input)
        : vocabularyApi.create(input as VocabularyCreateRequest),
    onSuccess: (item) => {
      cache(item);
      refresh();
    },
  });
}

export function useDeleteVocabulary() {
  const queryClient = useQueryClient();
  const refresh = useRefreshRelated();
  return useMutation({
    mutationFn: (id: string) => vocabularyApi.remove(id),
    onSuccess: (_v, id) => {
      queryClient.setQueryData<VocabularyItem[]>(vocabularyKeys.list, (list) =>
        list?.filter((i) => i.id !== id),
      );
      queryClient.removeQueries({ queryKey: vocabularyKeys.item(id) });
      refresh();
    },
  });
}

/** Optimistic: the star flips immediately and snaps back if the server refuses. */
export function useToggleVocabularyBookmark() {
  const queryClient = useQueryClient();
  const setFlag = (id: string, bookmarked: boolean) => {
    queryClient.setQueryData<VocabularyItem[]>(vocabularyKeys.list, (list) =>
      list?.map((i) => (i.id === id ? { ...i, bookmarked } : i)),
    );
    queryClient.setQueryData<VocabularyItem>(vocabularyKeys.item(id), (i) =>
      i ? { ...i, bookmarked } : i,
    );
  };
  return useMutation({
    mutationFn: ({ id, bookmarked }: { id: string; bookmarked: boolean }) =>
      bookmarked ? vocabularyApi.removeBookmark(id) : vocabularyApi.addBookmark(id),
    onMutate: ({ id, bookmarked }) => setFlag(id, !bookmarked),
    onError: (_e, { id, bookmarked }) => setFlag(id, bookmarked),
  });
}

export const useGenerateExample = () =>
  useMutation({ mutationFn: (word: string) => vocabularyApi.generateExample(word) });
