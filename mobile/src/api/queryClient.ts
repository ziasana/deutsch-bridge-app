import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

/** How long cached content stays usable: in memory and in the on-disk copy. */
export const CACHE_MAX_AGE = 24 * 60 * 60_000;

/** Static course content (lessons, articles): refetched in the background after this long. */
export const CONTENT_STALE_MS = 30 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Run even when the OS reports offline: requests fail into the normal error states
      // (with retry) instead of sitting paused behind a spinner.
      networkMode: 'always',
      staleTime: 60_000,
      // Kept long enough to be written to disk (see queryPersist) and reused after a restart.
      gcTime: CACHE_MAX_AGE,
      // Retry flaky network / server errors, never auth, validation or not-found.
      retry: (count, error) =>
        count < 2 && error instanceof ApiError && ['network', 'server'].includes(error.kind),
    },
    mutations: { networkMode: 'always' },
  },
});
