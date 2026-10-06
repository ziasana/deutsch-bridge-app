import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { aiUsageApi } from '@/api/aiUsageApi';
import type { AiFeature, AiFeatureUsage } from '@/types/aiUsage';

export const AI_USAGE_KEY = ['ai-usage'] as const;

/** Today's allowance for one feature; undefined when not limited, loading or unavailable. */
export function useAiUsage(feature: AiFeature): AiFeatureUsage | undefined {
  const { data } = useQuery({
    queryKey: AI_USAGE_KEY,
    queryFn: aiUsageApi.today,
    staleTime: 60_000,
    retry: false,
  });
  return data?.enforced ? data.features[feature] : undefined;
}

/** Call after an AI request (success or failure) so the counter reflects the server. */
export function useRefreshAiUsage(): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => void queryClient.invalidateQueries({ queryKey: AI_USAGE_KEY }), [queryClient]);
}
