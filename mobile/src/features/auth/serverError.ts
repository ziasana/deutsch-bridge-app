import { ApiError } from '@/api/errors';

export type ServerErrorMessages = { network: string; server: string; mailUnavailable: string };

/**
 * What to show for a failed sign-in / sign-up request, in the interface language. The API client's
 * own fallback texts are German; here connection and server problems get proper localized ones, a
 * 503 means the backend could not send the verification email, and messages the backend wrote for
 * the user (e.g. "Email already registered") are kept.
 */
export function authErrorMessage(
  error: unknown,
  m: ServerErrorMessages,
  /** Only sign-up sends an email; elsewhere a 503 is just a server problem. */
  sendsMail = true,
): string | undefined {
  if (!error) return undefined;
  if (error instanceof ApiError) {
    if (error.status === 503 && sendsMail) return m.mailUnavailable;
    if (error.kind === 'network') return m.network;
    if (error.kind === 'server') return m.server;
  }
  return error instanceof Error ? error.message : undefined;
}
