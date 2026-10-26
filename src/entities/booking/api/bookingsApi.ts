import { z } from 'zod';
import { createHttpClient, type HttpClient } from '@/shared/api';
import { API_BASE_URL } from '@/shared/config';
import { bookingSchema } from '../model/schema';
import type { Booking, BookingDraft, BookingPatch } from '../model/types';

/**
 * The contract the UI depends on. Any implementation will do:
 * HTTP, GraphQL, local storage, a test fake.
 */
export interface BookingsApi {
  list(date: string, options?: { signal?: AbortSignal }): Promise<Booking[]>;
  create(draft: BookingDraft): Promise<Booking>;
  update(id: string, patch: BookingPatch): Promise<Booking>;
  remove(id: string): Promise<void>;
}

const bookingListSchema = z.array(bookingSchema);

export function createHttpBookingsApi(request: HttpClient): BookingsApi {
  return {
    list: (date, options) =>
      request(`/api/bookings?date=${encodeURIComponent(date)}`, {
        signal: options?.signal,
        schema: bookingListSchema,
      }),
    create: (draft) =>
      request('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(draft),
        schema: bookingSchema,
      }),
    update: (id, patch) =>
      request(`/api/bookings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        schema: bookingSchema,
      }),
    remove: (id) => request<void>(`/api/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

export const bookingsApi: BookingsApi = createHttpBookingsApi(createHttpClient(API_BASE_URL));
