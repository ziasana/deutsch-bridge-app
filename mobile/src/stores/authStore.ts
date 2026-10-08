import { create } from 'zustand';
import { authApi } from '@/api/authApi';
import { configureApiClient } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/queryClient';
import { tokenStorage } from '@/api/tokenStorage';
import { usePremiumUpsellStore } from '@/stores/premiumUpsellStore';
import { clearDownloads } from '@/features/downloads/clear';
import { clearExamLocalData } from '@/features/exam/localData';
import { unregisterPush } from '@/features/notifications/push';
import type { MobileAuthData, UserProfile } from '@/types/user';

/**
 * loading        – restoring the session at app start
 * authenticated  – tokens valid, profile loaded
 * unauthenticated – no/ended session
 * error          – tokens exist but the profile couldn't be loaded (offline/server); retry, don't log out
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

type AuthState = {
  status: AuthStatus;
  profile: UserProfile | null;
  error: ApiError | null;
  restoreSession: () => Promise<void>;
  signIn: (data: MobileAuthData) => Promise<void>;
  signOut: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  profile: null,
  error: null,

  async restoreSession() {
    set({ status: 'loading', error: null });
    if (!(await tokenStorage.getRefresh())) {
      set({ status: 'unauthenticated' });
      return;
    }
    try {
      const profile = await authApi.getProfile();
      set({ status: 'authenticated', profile });
    } catch (error) {
      // 401 after a failed refresh already signed out via onSessionExpired.
      if (error instanceof ApiError && error.kind === 'unauthorized') {
        await get().signOut();
      } else {
        set({ status: 'error', error: error instanceof ApiError ? error : null });
      }
    }
  },

  async signIn({ accessToken, refreshToken, user }) {
    await tokenStorage.setTokens(accessToken, refreshToken);
    set({ status: 'authenticated', profile: user, error: null });
  },

  async signOut() {
    // While the tokens still work: this device must stop receiving the account's notifications.
    await unregisterPush();
    await tokenStorage.clear();
    // Drop all cached server data so the next account never sees the previous one's content.
    queryClient.clear();
    await clearExamLocalData();
    await clearDownloads();
    usePremiumUpsellStore.getState().close();
    set({ status: 'unauthenticated', profile: null, error: null });
  },

  setProfile: (profile) => set({ profile }),
}));

/** Wire the API client to the session. Called once at app start. */
export function initSession(): void {
  configureApiClient({
    getLanguage: () => useAuthStore.getState().profile?.preferredLanguage,
    onSessionExpired: () => {
      void useAuthStore.getState().signOut();
    },
    // A gated AI feature hit its daily limit: offer Premium wherever the learner is.
    onLimitReached: (message) => usePremiumUpsellStore.getState().open(message),
  });
}
