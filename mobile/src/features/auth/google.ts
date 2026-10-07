import { ApiError } from '@/api/errors';
import { env } from '@/config/env';
import type { Dictionary } from '@/i18n';

type Messages = Dictionary['entry']['auth']['google'];

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

let configured = false;

function load(m: Messages): GoogleModule {
  try {
    // Native module: absent in Expo Go, so load it lazily instead of crashing the whole app at start.
    return require('@react-native-google-signin/google-signin') as GoogleModule;
  } catch {
    throw new ApiError('unknown', m.unavailable);
  }
}

/**
 * Opens Google's account chooser and returns the ID token for the backend to verify, or `null` when the
 * person closed the chooser. Clearing the previous Google session first makes the chooser show every time.
 */
export async function requestGoogleIdToken(m: Messages): Promise<string | null> {
  if (!env.googleWebClientId) {
    throw new ApiError('unknown', m.notConfigured);
  }
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = load(m);
  if (!configured) {
    GoogleSignin.configure({
      webClientId: env.googleWebClientId,
      iosClientId: env.googleIosClientId || undefined,
    });
    configured = true;
  }
  try {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signOut().catch(() => undefined);
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;
    const token = response.data.idToken;
    if (!token) throw new ApiError('unknown', m.noToken);
    return token;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS)
        return null;
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ApiError('unknown', m.noPlayServices);
      }
    }
    throw new ApiError('unknown', m.failed);
  }
}
