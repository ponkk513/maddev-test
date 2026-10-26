export type { Booking, BookingDraft, BookingPatch, TimeRange } from './model/types';
export {
  MAX_DURATION_MIN,
  MIN_DURATION_MIN,
  SLOT_SIZE_MIN,
  TIME_STEP_MIN,
  TITLE_MAX_LENGTH,
  WORKDAY_END,
  WORKDAY_START,
} from './model/types';
export {
  findConflicts,
  isBookingLocked,
  isPastDate,
  isPastMoment,
  isToday,
  overlaps,
  sortByStart,
  validateDraft,
} from './model/rules';
export type { ValidationCode, ValidationField, ValidationIssue } from './model/rules';
export {
  buildDaySlots,
  buildTimeOptions,
  earliestBookableMinute,
  rangeStartingAt,
  suggestFreeRange,
} from './model/slots';
export type { Slot, SlotStatus, TimeOption } from './model/slots';
export { bookingDraftSchema, bookingPatchSchema, bookingSchema } from './model/schema';
export { formatBooking, formatBookings } from './lib/format';

export { bookingsApi, createHttpBookingsApi } from './api/bookingsApi';
export type { BookingsApi } from './api/bookingsApi';
export {
  bookingKeys,
  useBookings,
  useCreateBooking,
  useDeleteBooking,
  useUpdateBooking,
} from './api/queries';
export { getConflicts, getValidationIssues, hasErrorCode } from './api/errors';
export type { BookingErrorBody, BookingErrorCode } from './api/errors';

export { BookingList } from './ui/BookingList';
