import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'auth.accessToken';
const REFRESH_KEY = 'auth.refreshToken';

// Tokens live only in SecureStore (Keychain / Keystore) — never AsyncStorage.
// The in-memory copy avoids an async native read on every request.
let accessCache: string | null | undefined;

export const tokenStorage = {
  async getAccess(): Promise<string | null> {
    if (accessCache === undefined) accessCache = await SecureStore.getItemAsync(ACCESS_KEY);
    return accessCache;
  },
  getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setAccess(token: string): Promise<void> {
    accessCache = token;
    await SecureStore.setItemAsync(ACCESS_KEY, token);
  },
  async setTokens(access: string, refresh: string): Promise<void> {
    accessCache = access;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  },
  async clear(): Promise<void> {
    accessCache = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
