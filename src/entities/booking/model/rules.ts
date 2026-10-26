import {
  MAX_DURATION_MIN,
  MIN_DURATION_MIN,
  TITLE_MAX_LENGTH,
  WORKDAY_END,
  WORKDAY_START,
  type Booking,
  type BookingDraft,
  type TimeRange,
} from './types';
import {
  compareDates,
  formatDuration,
  isValidDate,
  isValidTime,
  minutesOfDay,
  toISODate,
  toMinutes,
} from '@/shared/lib';

export type ValidationCode =
  | 'INVALID_FORMAT'
  | 'PAST_DATE'
  | 'PAST_TIME'
  | 'OUTSIDE_WORKING_HOURS'
  | 'START_NOT_BEFORE_END'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'TITLE_TOO_LONG';

export type ValidationField = 'date' | 'start' | 'end' | 'title';

export type ValidationIssue = {
  field: ValidationField;
  code: ValidationCode;
  message: string;
};

// Half-open intervals [start, end): 10:00–11:00 and 11:00–12:00 do not overlap.
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

export function findConflicts(
  draft: Pick<BookingDraft, 'date' | 'start' | 'end'>,
  bookings: readonly Booking[],
  excludeId?: string,
): Booking[] {
  return bookings.filter((b) => b.id !== excludeId && b.date === draft.date && overlaps(b, draft));
}

export function isPastDate(date: string, now: Date): boolean {
  return compareDates(date, toISODate(now)) < 0;
}

export function isToday(date: string, now: Date): boolean {
  return date === toISODate(now);
}

export function isBookingLocked(booking: Booking, now: Date): boolean {
  if (isPastDate(booking.date, now)) return true;
  return isToday(booking.date, now) && toMinutes(booking.start) <= minutesOfDay(now);
}

export function validateDraft(draft: BookingDraft, now: Date): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isValidDate(draft.date)) {
    issues.push({ field: 'date', code: 'INVALID_FORMAT', message: 'Некорректная дата' });
  }
  if (!isValidTime(draft.start)) {
    issues.push({ field: 'start', code: 'INVALID_FORMAT', message: 'Укажите время начала' });
  }
  if (!isValidTime(draft.end)) {
    issues.push({ field: 'end', code: 'INVALID_FORMAT', message: 'Укажите время окончания' });
  }
  if (draft.title !== undefined && draft.title.trim().length > TITLE_MAX_LENGTH) {
    issues.push({
      field: 'title',
      code: 'TITLE_TOO_LONG',
      message: `Название — не длиннее ${TITLE_MAX_LENGTH} символов`,
    });
  }
  if (isValidDate(draft.date) && isPastDate(draft.date, now)) {
    issues.push({
      field: 'date',
      code: 'PAST_DATE',
      message: 'Нельзя бронировать на прошедшую дату',
    });
  }
  if (issues.length > 0) return issues;

  const start = toMinutes(draft.start);
  const end = toMinutes(draft.end);
  const dayStart = toMinutes(WORKDAY_START);
  const dayEnd = toMinutes(WORKDAY_END);
  const hours = `${WORKDAY_START}–${WORKDAY_END}`;

  if (start < dayStart || start >= dayEnd) {
    issues.push({
      field: 'start',
      code: 'OUTSIDE_WORKING_HOURS',
      message: `Начало должно быть в пределах рабочего дня (${hours})`,
    });
  }
  if (end <= dayStart || end > dayEnd) {
    issues.push({
      field: 'end',
      code: 'OUTSIDE_WORKING_HOURS',
      message: `Окончание должно быть в пределах рабочего дня (${hours})`,
    });
  }

  if (isToday(draft.date, now) && start < minutesOfDay(now)) {
    issues.push({
      field: 'start',
      code: 'PAST_TIME',
      message: 'Это время уже прошло',
    });
  }

  if (start >= end) {
    issues.push({
      field: 'end',
      code: 'START_NOT_BEFORE_END',
      message: 'Окончание должно быть позже начала',
    });
  } else if (end - start < MIN_DURATION_MIN) {
    issues.push({
      field: 'end',
      code: 'TOO_SHORT',
      message: `Минимальная длительность — ${formatDuration(MIN_DURATION_MIN)}`,
    });
  } else if (end - start > MAX_DURATION_MIN) {
    issues.push({
      field: 'end',
      code: 'TOO_LONG',
      message: `Максимальная длительность — ${formatDuration(MAX_DURATION_MIN)}`,
    });
  }

  return issues;
}

export function sortByStart(bookings: readonly Booking[]): Booking[] {
  return [...bookings].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}
