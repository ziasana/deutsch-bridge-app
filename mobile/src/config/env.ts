const raw = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
const origin = raw.replace(/\/+$/, '');

// Production bundles must never talk to the backend over plain HTTP.
if (!__DEV__ && !origin.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must use https in production builds');
}

export const env = {
  apiOrigin: origin,
  apiBaseUrl: `${origin}/api`,
  requestTimeoutMs: 20_000,
} as const;
