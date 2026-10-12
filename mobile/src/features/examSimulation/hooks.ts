import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examSimulationApi } from '@/api/examSimulationApi';

export const simKeys = {
  all: ['exam-simulation'] as const,
  profiles: ['exam-simulation', 'profiles'] as const,
  history: ['exam-simulation', 'history'] as const,
  result: (id: string) => ['exam-simulation', 'result', id] as const,
};

export const useSimulationProfiles = () =>
  useQuery({ queryKey: simKeys.profiles, queryFn: examSimulationApi.profiles, staleTime: 0 });

export const useSimulationHistory = () =>
  useQuery({ queryKey: simKeys.history, queryFn: examSimulationApi.history, staleTime: 0 });

export function useSimulationResult(attemptId: string) {
  return useQuery({
    queryKey: simKeys.result(attemptId),
    queryFn: () => examSimulationApi.result(attemptId),
    enabled: !!attemptId,
    retry: false,
    // While a manual assessment is outstanding the result changes; poll gently.
    refetchInterval: (query) => (query.state.data?.result.pendingAssessmentParts.length ? 60_000 : false),
  });
}

export function useStartSimulation() {
  return useMutation({ mutationFn: (profileId: string) => examSimulationApi.start(profileId) });
}

export function useCancelSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => examSimulationApi.cancel(attemptId),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: simKeys.all }),
  });
}
