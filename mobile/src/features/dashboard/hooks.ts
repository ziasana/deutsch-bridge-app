import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { dashboardApi } from '@/api/dashboardApi';

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
