import { z } from 'zod';
import type { Booking, BookingDraft, BookingPatch } from './types';

export const bookingSchema = z.object({
  id: z.string(),
  date: z.string(),
  start: z.string(),
  end: z.string(),
  title: z
    .string()
    .nullish()
    .transform((title) => title ?? undefined),
}) satisfies z.ZodType<Booking, z.ZodTypeDef, unknown>;

export const bookingDraftSchema = bookingSchema.omit({
  id: true,
}) satisfies z.ZodType<BookingDraft, z.ZodTypeDef, unknown>;

export const bookingPatchSchema = bookingDraftSchema.partial() satisfies z.ZodType<
  BookingPatch,
  z.ZodTypeDef,
  unknown
>;
