import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { redemittelApi } from '@/api/redemittelApi';
import { DASHBOARD_KEY } from '@/features/dashboard/hooks';
import type { Redemittel, RedemittelListParams, RedemittelPage } from '@/types/redemittel';

export const PAGE_SIZE = 12;

export const redemittelKeys = {
  root: ['redemittel'] as const,
  hub: ['redemittel', 'hub'] as const,
  list: (p: RedemittelListParams) => ['redemittel', 'list', p] as const,
  detail: (id: string) => ['redemittel', 'detail', id] as const,
};

export const useRedemittelHub = () =>
  useQuery({ queryKey: redemittelKeys.hub, queryFn: redemittelApi.hub, staleTime: 60_000 });

export const useRedemittelList = (params: RedemittelListParams) =>
  useInfiniteQuery({
    queryKey: redemittelKeys.list(params),
    queryFn: ({ pageParam }) => redemittelApi.page(pageParam, PAGE_SIZE, params),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    staleTime: 30_000,
  });

export const useRedemittel = (id: string | undefined) =>
  useQuery({
    queryKey: redemittelKeys.detail(id ?? ''),
    queryFn: () => redemittelApi.byId(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

/** The day's quota: fetched once so the list never shrinks while the learner works through it. */
export const useTodayRedemittel = (enabled = true) =>
  useQuery({
    queryKey: ['redemittel', 'today'],
    queryFn: redemittelApi.today,
    enabled,
    staleTime: Infinity,
    gcTime: 0,
  });

/** A peek at today's new phrases for the hub; separate from the learn flow's frozen list. */
export const useTodayPreview = (enabled: boolean) =>
  useQuery({
    queryKey: ['redemittel', 'today-preview'],
    queryFn: redemittelApi.today,
    enabled,
    staleTime: 60_000,
  });

/** Sessions are fetched once per visit: answering moves items out of "due" and must not reshuffle. */
export const useRedemittelSession = (mode: 'review' | 'practice', ids?: string[]) =>
  useQuery({
    queryKey: ['redemittel', `${mode}-session`, ids?.join(',') ?? ''],
    queryFn: () =>
      mode === 'review' ? redemittelApi.reviewSession(10) : redemittelApi.practiceSession(ids),
    staleTime: Infinity,
    gcTime: 0,
  });

type Pages = InfiniteData<RedemittelPage, number>;

/** Writes one changed Redemittel into every cached list and its detail, then refreshes the counters. */
function useAfterChange() {
  const queryClient = useQueryClient();
  return (updated: Redemittel) => {
    queryClient.setQueryData(redemittelKeys.detail(updated.id), updated);
    queryClient.setQueriesData<Pages>({ queryKey: ['redemittel', 'list'] }, (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((r) => (r.id === updated.id ? updated : r)),
            })),
          }
        : old,
    );
    void queryClient.invalidateQueries({ queryKey: redemittelKeys.hub });
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
  };
}

export function useToggleSave() {
  const after = useAfterChange();
  return useMutation({
    mutationFn: (r: Redemittel) =>
      r.saved ? redemittelApi.unsave(r.id) : redemittelApi.save(r.id),
    onSuccess: after,
  });
}

export function useLearnRedemittel() {
  const after = useAfterChange();
  return useMutation({
    mutationFn: (r: Redemittel) => redemittelApi.learn(r.id),
    onSuccess: after,
  });
}

export function useAnswer(mode: 'review' | 'practice') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { phraseId: string; exerciseId: string; answer: string }) =>
      (mode === 'review' ? redemittelApi.answerReview : redemittelApi.answerPractice)(
        v.phraseId,
        v.exerciseId,
        v.answer,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: redemittelKeys.hub });
      void queryClient.invalidateQueries({ queryKey: ['redemittel', 'list'] });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
