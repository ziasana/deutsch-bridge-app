import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { dashboardApi } from '@/api/dashboardApi';
import { examTimeApi } from '@/api/examTimeApi';
import { grammarApi } from '@/api/grammarApi';

export const DASHBOARD_KEY = ['dashboard'] as const;

export function useDashboard() {
  const query = useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: dashboardApi.get,
    staleTime: 60_000,
  });

  // Coming back to the Home tab after learning should show fresh numbers, but only
  // refetch when the cached data is actually stale (the initial mount already fetches).
  const { refetch, isStale } = query;
  const mounted = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (mounted.current && isStale) void refetch();
      mounted.current = true;
    }, [refetch, isStale]),
  );

  return query;
}

/** Bookmarked-but-unlearned grammar lessons: the "saved lessons" reminder on Home. */
export const usePendingBookmarkCount = () =>
  useQuery({
    queryKey: ['grammar', 'pending-bookmarks'],
    queryFn: grammarApi.pendingBookmarks,
    staleTime: 60_000,
    select: (items) => items.length,
  });

/** Timed exam exercises finished this week; only asked for TELC learners. */
export const useExamWeekSummary = (enabled: boolean) =>
  useQuery({
    queryKey: ['exam', 'time-week-summary'],
    queryFn: examTimeApi.weekSummary,
    enabled,
    staleTime: 60_000,
  });
