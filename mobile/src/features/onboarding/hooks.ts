import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/userApi';
import { useAuthStore } from '@/stores/authStore';
import type { OnboardingRequest } from './plan';

/** On success the stored profile flips to onboardingCompleted and the route guard opens the app. */
export function useCompleteOnboarding() {
  const setProfile = useAuthStore((s) => s.setProfile);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: OnboardingRequest) => userApi.completeOnboarding(request),
    onSuccess: (profile) => {
      setProfile(profile);
      void queryClient.invalidateQueries();
    },
  });
}
