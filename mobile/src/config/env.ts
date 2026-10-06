const raw = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
const origin = raw.replace(/\/+$/, '');

// Production bundles must never talk to the backend over plain HTTP.
if (!__DEV__ && !origin.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must use https in production builds');
}

/** Dev-only design check: opens the onboarding wizard without an account and saves nothing. */
const onboardingPreview = __DEV__ && process.env.EXPO_PUBLIC_ONBOARDING_PREVIEW === '1';

export const env = {
  onboardingPreview,
  apiOrigin: origin,
  apiBaseUrl: `${origin}/api`,
  requestTimeoutMs: 20_000,
  /** AI-backed endpoints (chat, feedback, judging) can take much longer than normal requests. */
  aiRequestTimeoutMs: 90_000,
} as const;
