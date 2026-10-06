import { useMutation } from '@tanstack/react-query';
import { userApi } from '@/api/userApi';
import type { OnboardingRequest } from './plan';

/** Saves the plan and resolves with the updated profile. The caller decides when to apply it. */
export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: (request: OnboardingRequest) => userApi.completeOnboarding(request),
  });
}
