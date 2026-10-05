import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Run even when the OS reports offline: requests fail into the normal error states
      // (with retry) instead of sitting paused behind a spinner.
      networkMode: 'always',
      staleTime: 60_000,
      // Retry flaky network / server errors, never auth, validation or not-found.
      retry: (count, error) =>
        count < 2 && error instanceof ApiError && ['network', 'server'].includes(error.kind),
    },
    mutations: { networkMode: 'always' },
  },
});
