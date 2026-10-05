import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { notificationApi } from '@/api/notificationApi';
import { useAuthStore } from '@/stores/authStore';
import type {
  NotificationCategory,
  NotificationItem,
  NotificationPage,
  NotificationPreferences,
} from '@/types/notification';

export const PAGE_SIZE = 20;

export type Tab = 'all' | 'learning' | 'progress' | 'system';
export const TAB_CATEGORIES: Record<Tab, NotificationCategory[]> = {
  all: [],
  learning: ['LEARNING', 'REMINDER'],
  progress: ['PROGRESS'],
  system: ['SYSTEM', 'PREMIUM'],
};

export const notificationKeys = {
  root: ['notifications'] as const,
  list: (tab: Tab) => ['notifications', 'list', tab] as const,
  unread: ['notifications', 'unread-count'] as const,
  preferences: ['notifications', 'preferences'] as const,
};

export const useUnreadCount = () =>
  useQuery({
    queryKey: notificationKeys.unread,
    queryFn: notificationApi.unreadCount,
    staleTime: 30_000,
    select: (d) => d.count,
  });

export const useNotificationList = (tab: Tab) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(tab),
    queryFn: ({ pageParam }) => notificationApi.page(pageParam, PAGE_SIZE, TAB_CATEGORIES[tab]),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    staleTime: 30_000,
  });

type Pages = InfiniteData<NotificationPage, number>;

/** Applies a change to every cached list (all tabs), so a read item looks read everywhere. */
function patchLists(
  queryClient: ReturnType<typeof useQueryClient>,
  patch: (item: NotificationItem) => NotificationItem,
) {
  queryClient.setQueriesData<Pages>({ queryKey: ['notifications', 'list'] }, (old) =>
    old ? { ...old, pages: old.pages.map((p) => ({ ...p, items: p.items.map(patch) })) } : old,
  );
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      patchLists(queryClient, (n) => ({ ...n, read: true }));
      queryClient.setQueryData(notificationKeys.unread, { count: 0 });
    },
  });
}

/** Records the click (which marks it read) and resolves to the notification's destination (a web path). */
export function useOpenNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (n: NotificationItem) => {
      try {
        return (await notificationApi.click(n.id)).actionUrl;
      } catch {
        return n.actionUrl; // the click is only analytics; still take the learner there
      }
    },
    onMutate: (n) => {
      if (n.read) return;
      patchLists(queryClient, (x) => (x.id === n.id ? { ...x, read: true } : x));
      queryClient.setQueryData<{ count: number }>(notificationKeys.unread, (c) => ({
        count: Math.max(0, (c?.count ?? 1) - 1),
      }));
    },
  });
}

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: notificationApi.preferences,
    staleTime: 5 * 60_000,
  });

/** Every change is saved immediately and optimistically; a failure rolls the toggle back. */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) => notificationApi.updatePreferences(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences });
      const previous = queryClient.getQueryData<NotificationPreferences>(notificationKeys.preferences);
      if (previous) queryClient.setQueryData(notificationKeys.preferences, { ...previous, ...patch });
      return { previous };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notificationKeys.preferences, ctx.previous);
    },
    onSuccess: (res, patch) => {
      queryClient.setQueryData(notificationKeys.preferences, res.data);
      // The profile's older notificationsEnabled flag mirrors the master switch on the backend.
      const profile = useAuthStore.getState().profile;
      if (patch.learningRemindersEnabled !== undefined && profile) {
        useAuthStore.getState().setProfile({ ...profile, notificationsEnabled: patch.learningRemindersEnabled });
      }
    },
  });
}
