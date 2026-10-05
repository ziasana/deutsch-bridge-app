import { env } from '@/config/env';
import { ApiError, fallbackMessage, kindFromStatus } from './errors';
import { tokenStorage } from './tokenStorage';

type Hooks = {
  /** Explanation language sent as Accept-Language (backend default is EN). */
  getLanguage: () => string | null | undefined;
  /** Called once when the refresh token is rejected and the session is over. */
  onSessionExpired: () => void;
  /** Called when the backend reports a daily feature limit (HTTP 429). */
  onLimitReached?: (message: string) => void;
};

let hooks: Hooks = { getLanguage: () => null, onSessionExpired: () => {} };

/** Wired up once at app start so the client has no dependency on stores/UI. */
export function configureApiClient(next: Partial<Hooks>): void {
  hooks = { ...hooks, ...next };
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Skip the Authorization header and 401 refresh handling (login, register, refresh…). */
  auth?: boolean;
  signal?: AbortSignal;
};

// ---- refresh lock: concurrent 401s share a single refresh request ----
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchanges the refresh token for a new access token.
 * Resolves false only when the server rejected the refresh token; a network failure throws
 * so a flaky connection never logs the user out.
 */
export function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = await tokenStorage.getRefresh();
  if (!refreshToken) return false;

  const data = await request<{ data: { accessToken: string } }>('/auth/mobile/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  }).catch((error: unknown) => {
    if (error instanceof ApiError && ['unauthorized', 'forbidden'].includes(error.kind)) {
      return null;
    }
    throw error;
  });

  if (!data) return false;
  await tokenStorage.setAccess(data.data.accessToken);
  return true;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(env.apiBaseUrl + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function messageFrom(body: unknown): string | null {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return null;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const language = hooks.getLanguage();
  if (language) headers['Accept-Language'] = language.toUpperCase();

  if (options.auth !== false) {
    const token = await tokenStorage.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs);
  options.signal?.addEventListener('abort', () => controller.abort());

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('network', fallbackMessage('network'));
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Central request function. Returns the parsed JSON body (undefined for empty responses).
 * On 401: refreshes once (shared across concurrent requests), retries, and ends the session
 * if the refresh token is rejected.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && options.auth !== false) {
    let refreshed = false;
    try {
      refreshed = await refreshAccessToken();
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('network', fallbackMessage('network'));
    }
    if (!refreshed) {
      await tokenStorage.clear();
      hooks.onSessionExpired();
      throw new ApiError('unauthorized', fallbackMessage('unauthorized'), 401);
    }
    response = await send(path, options);
  }

  const body = await parseBody(response);

  if (!response.ok) {
    const kind = kindFromStatus(response.status);
    const message = messageFrom(body);
    if (kind === 'limit') hooks.onLimitReached?.(message ?? fallbackMessage('limit'));
    // Server-provided messages are trusted for 4xx (validation/limit); 5xx get a friendly fallback.
    const text = kind === 'server' ? fallbackMessage(kind) : (message ?? fallbackMessage(kind));
    throw new ApiError(kind, text, response.status);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
