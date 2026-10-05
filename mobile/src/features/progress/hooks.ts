import { useQuery } from '@tanstack/react-query';
import { progressApi } from '@/api/progressApi';

export const progressKeys = {
  overview: ['learning-progress', 'overview'] as const,
  stats: ['learning-progress', 'stats'] as const,
};

// Practice results are the only thing that changes these numbers; a short staleTime keeps them
// close to real-time without refetching on every visit.
export const useProgressOverview = () =>
  useQuery({ queryKey: progressKeys.overview, queryFn: progressApi.overview, staleTime: 60_000 });

export const useProgressStats = () =>
  useQuery({ queryKey: progressKeys.stats, queryFn: progressApi.stats, staleTime: 60_000 });
