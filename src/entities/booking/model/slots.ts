import {
  MIN_DURATION_MIN,
  SLOT_SIZE_MIN,
  TIME_STEP_MIN,
  WORKDAY_END,
  WORKDAY_START,
  type Booking,
  type TimeRange,
} from './types';
import { findConflicts, isPastDate, isToday } from './rules';
import { fromMinutes, minutesOfDay, toMinutes } from '@/shared/lib';

const DAY_START = toMinutes(WORKDAY_START);
const DAY_END = toMinutes(WORKDAY_END);
const DEFAULT_DURATION_MIN = 60;

export function earliestBookableMinute(date: string, now: Date): number | null {
  if (isPastDate(date, now)) return null;
  if (!isToday(date, now)) return DAY_START;
  const nowMin = minutesOfDay(now);
  const rounded = Math.ceil(nowMin / TIME_STEP_MIN) * TIME_STEP_MIN;
  const earliest = Math.max(DAY_START, rounded);
  return earliest + MIN_DURATION_MIN <= DAY_END ? earliest : null;
}

export type TimeOption = { value: string; disabled: boolean };

export function buildTimeOptions(kind: 'start' | 'end', date: string, now: Date): TimeOption[] {
  const from = kind === 'start' ? DAY_START : DAY_START + MIN_DURATION_MIN;
  const to = kind === 'start' ? DAY_END - MIN_DURATION_MIN : DAY_END;
  const earliest = earliestBookableMinute(date, now);
  const options: TimeOption[] = [];
  for (let m = from; m <= to; m += TIME_STEP_MIN) {
    const disabled =
      earliest === null || (kind === 'start' ? m < earliest : m < earliest + MIN_DURATION_MIN);
    options.push({ value: fromMinutes(m), disabled });
  }
  return options;
}

export function rangeStartingAt(
  startMin: number,
  bookings: readonly Booking[],
  excludeId?: string,
): TimeRange {
  const nextBusyStart = bookings
    .filter((b) => b.id !== excludeId && toMinutes(b.start) >= startMin)
    .reduce((min, b) => Math.min(min, toMinutes(b.start)), DAY_END);
  const end = Math.max(
    startMin + MIN_DURATION_MIN,
    Math.min(startMin + DEFAULT_DURATION_MIN, nextBusyStart, DAY_END),
  );
  return { start: fromMinutes(startMin), end: fromMinutes(Math.min(end, DAY_END)) };
}

export function suggestFreeRange(
  date: string,
  bookings: readonly Booking[],
  now: Date,
  excludeId?: string,
): TimeRange | null {
  const earliest = earliestBookableMinute(date, now);
  if (earliest === null) return null;
  for (let m = earliest; m + MIN_DURATION_MIN <= DAY_END; m += TIME_STEP_MIN) {
    const candidate = { date, start: fromMinutes(m), end: fromMinutes(m + MIN_DURATION_MIN) };
    if (findConflicts(candidate, bookings, excludeId).length === 0) {
      return rangeStartingAt(m, bookings, excludeId);
    }
  }
  return null;
}

export type SlotStatus = 'free' | 'busy' | 'past';
export type Slot = TimeRange & { status: SlotStatus };

export function buildDaySlots(
  date: string,
  bookings: readonly Booking[],
  now: Date,
  excludeId?: string,
): Slot[] {
  const earliest = earliestBookableMinute(date, now);
  const slots: Slot[] = [];
  for (let m = DAY_START; m < DAY_END; m += SLOT_SIZE_MIN) {
    const range = { date, start: fromMinutes(m), end: fromMinutes(m + SLOT_SIZE_MIN) };
    let status: SlotStatus = 'free';
    if (findConflicts(range, bookings, excludeId).length > 0) status = 'busy';
    else if (earliest === null || m < earliest) status = 'past';
    slots.push({ start: range.start, end: range.end, status });
  }
  return slots;
}
