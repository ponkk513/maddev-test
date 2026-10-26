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
  /** The booking being edited — it must not conflict with itself. */
  excludeId?: string;
};

export const EMPTY_VALUES: BookingFormValues = { start: '', end: '', title: '' };

/**
 * The form schema is a thin adapter: the rules themselves are pure functions of the
 * booking entity (shared with the server); here they are mapped onto form fields.
 * Built per render because the rules depend on "now" and on the day's bookings.
 */
export function createBookingFormSchema(ctx: BookingFormContext) {
  return z
    .object({ start: z.string(), end: z.string(), title: z.string() })
    .superRefine((values, issueCtx) => {
      const draft = { date: ctx.date, ...values };
      const issues = validateDraft(draft, ctx.now);
      for (const issue of issues) {
        // A past date is not a field error: the form is not offered for such dates at all.
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

/** An empty string explicitly clears the title (undefined would be dropped from JSON). */
export function toPatch(values: BookingFormValues): BookingPatch {
  return { start: values.start, end: values.end, title: values.title.trim() };
}

export function toValues(booking: Booking): BookingFormValues {
  return { start: booking.start, end: booking.end, title: booking.title ?? '' };
}
