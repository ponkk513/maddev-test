import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: (failureCount, error) =>
          !(isApiError(error) && error.isClientError) && failureCount < 1,
      },
      mutations: { retry: false },
    },
  });
}
