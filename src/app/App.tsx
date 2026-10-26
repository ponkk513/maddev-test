import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BookingPage } from '@/pages/booking';
import { AppProviders } from './providers/AppProviders';

type Props = {
  devTools?: ReactNode;
  queryClient?: QueryClient;
};

export function App({ devTools, queryClient }: Props) {
  return (
    <AppProviders queryClient={queryClient}>
      <BookingPage />
      {devTools}
    </AppProviders>
  );
}
