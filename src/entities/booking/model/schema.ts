import { z } from 'zod';
import type { Booking, BookingDraft, BookingPatch } from './types';

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
