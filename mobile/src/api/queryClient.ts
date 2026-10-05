import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Retry flaky network / server errors, never auth, validation or not-found.
      retry: (count, error) =>
        count < 2 && error instanceof ApiError && ['network', 'server'].includes(error.kind),
    },
  },
});
