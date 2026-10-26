import { setupServer } from 'msw/node';
import type { Booking } from '@/entities/booking';
import { mockSettings } from '@/mocks/devTools';
import { createHandlers } from '@/mocks/handlers';
import { BookingStore } from '@/mocks/store';

export function createTestServer(initial: Booking[] = []) {
  const store = new BookingStore(null, initial);
  const server = setupServer(...createHandlers({ store }));
  mockSettings.set({ latencyMs: 0, serverDown: false, simulateConflictOnNextWrite: false });
  return { server, store };
}
