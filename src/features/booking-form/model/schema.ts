import { z } from 'zod';
import {
  findConflicts,
  formatBookings,
  validateDraft,
  type Booking,
  type BookingDraft,
  type BookingPatch,
} from '@/entities/booking';

export type BookingFormValues = { start: string; end: string; title: string };

export type BookingFormContext = {
  date: string;
  now: Date;
  bookings: readonly Booking[];
  excludeId?: string;
};

export const EMPTY_VALUES: BookingFormValues = { start: '', end: '', title: '' };

export function createBookingFormSchema(ctx: BookingFormContext) {
  return z
    .object({ start: z.string(), end: z.string(), title: z.string() })
    .superRefine((values, issueCtx) => {
      const draft = { date: ctx.date, ...values };
      const issues = validateDraft(draft, ctx.now);
      for (const issue of issues) {
        if (issue.field === 'date') continue;
        issueCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [issue.field],
          message: issue.message,
        });
      }
      if (issues.length > 0) return;

      const conflicts = findConflicts(draft, ctx.bookings, ctx.excludeId);
      if (conflicts.length > 0) {
        issueCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['start'],
          message: `Пересекается с бронью ${formatBookings(conflicts)}`,
        });
      }
    });
}

export function toDraft(values: BookingFormValues, date: string): BookingDraft {
  return { date, start: values.start, end: values.end, title: values.title.trim() || undefined };
}

// '' rather than undefined: an undefined title would be dropped from JSON and not cleared.
export function toPatch(values: BookingFormValues): BookingPatch {
  return { start: values.start, end: values.end, title: values.title.trim() };
}

export function toValues(booking: Booking): BookingFormValues {
  return { start: booking.start, end: booking.end, title: booking.title ?? '' };
}
