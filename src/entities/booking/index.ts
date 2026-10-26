export type { Booking, BookingDraft, BookingPatch, TimeRange } from './model/types';
export {
  MIN_DURATION_MIN,
  SLOT_SIZE_MIN,
  TITLE_MAX_LENGTH,
  WORKDAY_END,
  WORKDAY_START,
} from './model/types';
export {
  findConflicts,
  isBookingLocked,
  isPastDate,
  isToday,
  sortByStart,
  validateDraft,
} from './model/rules';
export { buildDaySlots, buildTimeOptions, rangeStartingAt, suggestFreeRange } from './model/slots';
export { bookingDraftSchema, bookingPatchSchema } from './model/schema';
export { formatBooking, formatBookings } from './lib/format';

export { createHttpBookingsApi } from './api/bookingsApi';
export { useBookings, useCreateBooking, useDeleteBooking, useUpdateBooking } from './api/queries';
export { getConflicts, getValidationIssues, isConflictError, isNotFoundError } from './api/errors';
export type { BookingErrorBody } from './api/errors';

export { BookingList } from './ui/BookingList';
