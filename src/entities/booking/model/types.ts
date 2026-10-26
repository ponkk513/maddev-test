export type Booking = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  title?: string;
};

/** Payload for creating a booking. */
export type BookingDraft = Omit<Booking, 'id'>;

/** Payload for PATCH: any subset of fields. */
export type BookingPatch = Partial<BookingDraft>;

export type TimeRange = Pick<Booking, 'start' | 'end'>;

export const WORKDAY_START = '09:00';
export const WORKDAY_END = '18:00';
export const MIN_DURATION_MIN = 30;
export const MAX_DURATION_MIN = 120;
export const TITLE_MAX_LENGTH = 80;

/** Step of time pickers in the form. */
export const TIME_STEP_MIN = 15;
/** Size of a slot on the timeline. */
export const SLOT_SIZE_MIN = 30;
