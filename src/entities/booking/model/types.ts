export type Booking = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  title?: string;
};

export type BookingDraft = Omit<Booking, 'id'>;

export type BookingPatch = Partial<BookingDraft>;

export type TimeRange = Pick<Booking, 'start' | 'end'>;

export const WORKDAY_START = '09:00';
export const WORKDAY_END = '18:00';
export const MIN_DURATION_MIN = 30;
export const MAX_DURATION_MIN = 120;
export const TITLE_MAX_LENGTH = 80;

export const TIME_STEP_MIN = 15;
export const SLOT_SIZE_MIN = 30;
