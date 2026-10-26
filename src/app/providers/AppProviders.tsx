import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { NotificationsProvider } from '@/shared/ui';
import { createQueryClient } from './queryClient';

type Props = {
  children: ReactNode;
  /** Injected in tests to get an isolated cache. */
  queryClient?: QueryClient;
};

export function AppProviders({ children, queryClient }: Props) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <NotificationsProvider>{children}</NotificationsProvider>
    </QueryClientProvider>
  );
}
