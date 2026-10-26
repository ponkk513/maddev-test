import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BookingPage } from '@/pages/booking';
import { AppProviders } from './providers/AppProviders';

type Props = {
  /** Extra UI outside the product (the mock API dev panel). */
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
