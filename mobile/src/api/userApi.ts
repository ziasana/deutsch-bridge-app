import type { OnboardingRequest } from '@/features/onboarding/plan';
import type { ApiResponse, PreferredLanguage, UserProfile } from '@/types/user';
import { api } from './client';

export type ProfileUpdate = {
  displayName?: string;
  learningLevel?: string;
  dailyGoalWords?: number;
  preferredLanguage?: PreferredLanguage;
};

/** A picked local image, ready to upload as the avatar. */
export type AvatarFile = { uri: string; name: string; type: string };

export const userApi = {
  /** Fields left out stay unchanged on the server. */
  updateProfile: (update: ProfileUpdate) =>
    api.put<ApiResponse<null>>('/user/update-profile', update),
  /** Saves the learning plan and marks onboarding done; → the full updated profile. */
  completeOnboarding: (request: OnboardingRequest) =>
    api.put<ApiResponse<UserProfile>>('/user/onboarding', request).then((r) => r.data),
  updatePassword: (currentPassword: string, password: string) =>
    api.put<ApiResponse<null>>('/user/update-password', { currentPassword, password }),
  /** → the new relative avatar URL ("/uploads/..."). */
  uploadAvatar: (file: AvatarFile) => {
    const form = new FormData();
    // React Native's FormData accepts { uri, name, type } as a file part.
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
    return api.upload<ApiResponse<string>>('/user/avatar', form).then((r) => r.data);
  },
};
