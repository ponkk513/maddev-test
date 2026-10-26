import { setupWorker } from 'msw/browser';
import { createHandlers } from './handlers';
import { BookingStore } from './store';

export const mockStore = new BookingStore();

export const worker = setupWorker(...createHandlers({ store: mockStore }));
