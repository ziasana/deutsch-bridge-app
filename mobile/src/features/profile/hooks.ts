import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type AvatarFile, type ProfileUpdate } from '@/api/userApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';

/**
 * Saves profile fields and mirrors them into the session profile. Level, language and goal change
 * what the other screens show, so cached server data is refreshed afterwards.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((s) => s.setProfile);
  return useMutation({
    mutationFn: (update: ProfileUpdate) => userApi.updateProfile(update),
    onSuccess: (_res, update) => {
      const current = useAuthStore.getState().profile;
      // Merge onto the existing profile: replacing it would drop onboarding state and role.
      if (current) setProfile({ ...current, ...update } as UserProfile);
      void queryClient.invalidateQueries();
    },
  });
}

export function useUploadAvatar() {
  const setProfile = useAuthStore((s) => s.setProfile);
  return useMutation({
    mutationFn: (file: AvatarFile) => userApi.uploadAvatar(file),
    onSuccess: (avatarUrl) => {
      const current = useAuthStore.getState().profile;
      if (current) setProfile({ ...current, avatarUrl });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      userApi.updatePassword(current, next),
  });
}
