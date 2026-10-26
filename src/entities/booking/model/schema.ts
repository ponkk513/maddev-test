import { z } from 'zod';
import type { Booking, BookingDraft, BookingPatch } from './types';

/**
 * Shapes of the API contract. They check *structure* only (what a request/response
 * must look like); business rules live in `rules.ts` and are reported as 422.
 */
export const bookingSchema = z.object({
  id: z.string(),
  date: z.string(),
  start: z.string(),
  end: z.string(),
  title: z.string().optional(),
}) satisfies z.ZodType<Booking>;

export const bookingDraftSchema = bookingSchema.omit({
  id: true,
}) satisfies z.ZodType<BookingDraft>;

export const bookingPatchSchema = bookingDraftSchema.partial() satisfies z.ZodType<BookingPatch>;
