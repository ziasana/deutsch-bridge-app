import { authApi } from '@/api/authApi';
import { ApiError } from '@/api/errors';
import { tokenStorage } from '@/api/tokenStorage';
import { queryClient } from '@/api/queryClient';
import type { UserProfile } from '@/types/user';
import { useAuthStore } from '../authStore';

jest.mock('@/api/authApi');

const profile = { displayName: 'Ali', email: 'a@b.de', preferredLanguage: 'PR' } as UserProfile;
const getProfile = authApi.getProfile as jest.MockedFunction<typeof authApi.getProfile>;

describe('authStore', () => {
  beforeEach(async () => {
    getProfile.mockReset();
    await tokenStorage.clear();
    useAuthStore.setState({ status: 'loading', profile: null, error: null });
  });

  it('is unauthenticated on start when no refresh token is stored', async () => {
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('restores an existing session from stored tokens', async () => {
    await tokenStorage.setTokens('a', 'r');
    getProfile.mockResolvedValue(profile);
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState()).toMatchObject({ status: 'authenticated', profile });
  });

  it('keeps tokens and shows retry state when offline at startup', async () => {
    await tokenStorage.setTokens('a', 'r');
    getProfile.mockRejectedValue(new ApiError('network', 'offline'));
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().status).toBe('error');
    expect(await tokenStorage.getRefresh()).toBe('r');
  });

  it('signs out and clears tokens when the session is no longer valid', async () => {
    await tokenStorage.setTokens('a', 'r');
    getProfile.mockRejectedValue(new ApiError('unauthorized', 'expired', 401));
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(await tokenStorage.getRefresh()).toBeNull();
  });

  it('signIn persists tokens; signOut wipes tokens, profile and query cache', async () => {
    await useAuthStore.getState().signIn({ accessToken: 'a', refreshToken: 'r', user: profile });
    expect(await tokenStorage.getRefresh()).toBe('r');
    expect(useAuthStore.getState().status).toBe('authenticated');

    queryClient.setQueryData(['dashboard'], { secret: true });
    await useAuthStore.getState().signOut();
    expect(await tokenStorage.getAccess()).toBeNull();
    expect(useAuthStore.getState()).toMatchObject({ status: 'unauthenticated', profile: null });
    expect(queryClient.getQueryData(['dashboard'])).toBeUndefined();
  });
});
