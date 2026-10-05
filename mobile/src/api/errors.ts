export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'limit'
  | 'server'
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 429) return 'limit';
  if (status === 400 || status === 409 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

// Friendly fallbacks; never surface raw backend stack traces.
const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Keine Verbindung. Bitte überprüfe dein Internet und versuche es erneut.',
  unauthorized: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  forbidden: 'Dazu hast du keine Berechtigung.',
  notFound: 'Dieser Inhalt wurde nicht gefunden.',
  validation: 'Bitte überprüfe deine Eingaben.',
  limit: 'Das Tageslimit für diese Funktion ist erreicht.',
  server: 'Der Server ist gerade nicht erreichbar. Bitte versuche es später erneut.',
  unknown: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
};

export function fallbackMessage(kind: ApiErrorKind): string {
  return FALLBACK_MESSAGES[kind];
}

/** Whether showing a "retry" action makes sense for this error. */
export function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && (error.kind === 'network' || error.kind === 'server');
}

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError('unknown', fallbackMessage('unknown'));
}
