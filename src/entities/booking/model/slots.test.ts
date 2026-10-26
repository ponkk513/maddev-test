import type { Booking } from './types';
import {
  buildDaySlots,
  buildTimeOptions,
  earliestBookableMinute,
  rangeStartingAt,
  suggestFreeRange,
} from './slots';
import { fromMinutes } from '@/shared/lib';

const NOW = new Date(2030, 2, 4, 12, 10);
const TODAY = '2030-03-04';
const TOMORROW = '2030-03-05';

describe('earliestBookableMinute', () => {
  it('rounds "now" up to the picker step for today', () => {
    expect(fromMinutes(earliestBookableMinute(TODAY, NOW)!)).toBe('12:15');
  });
  it('is the day start for future dates and null for past ones', () => {
    expect(fromMinutes(earliestBookableMinute(TOMORROW, NOW)!)).toBe('09:00');
    expect(earliestBookableMinute('2030-03-01', NOW)).toBeNull();
  });
  it('is null when less than the minimum duration is left today', () => {
    expect(earliestBookableMinute(TODAY, new Date(2030, 2, 4, 17, 40))).toBeNull();
  });
});

describe('buildTimeOptions', () => {
  it('disables past start options today', () => {
    const options = buildTimeOptions('start', TODAY, NOW);
    expect(options.find((o) => o.value === '12:00')?.disabled).toBe(true);
    expect(options.find((o) => o.value === '12:15')?.disabled).toBe(false);
    expect(options.at(-1)?.value).toBe('17:30');
  });
});

describe('suggestFreeRange', () => {
  const bookings: Booking[] = [
    { id: 'a', date: TOMORROW, start: '09:00', end: '10:00' },
    { id: 'b', date: TOMORROW, start: '10:30', end: '12:00' },
  ];

  it('finds the first gap and shortens to the next booking', () => {
    expect(suggestFreeRange(TOMORROW, bookings, NOW)).toEqual({ start: '10:00', end: '10:30' });
  });

  it('ignores the booking being edited', () => {
    expect(suggestFreeRange(TOMORROW, bookings, NOW, 'a')).toEqual({
      start: '09:00',
      end: '10:00',
    });
  });

  it('returns null for a fully booked day', () => {
    const full: Booking[] = Array.from({ length: 9 }, (_, i) => ({
      id: String(i),
      date: TOMORROW,
      start: fromMinutes(540 + i * 60),
      end: fromMinutes(600 + i * 60),
    }));
    expect(suggestFreeRange(TOMORROW, full, NOW)).toBeNull();
  });
});

describe('rangeStartingAt', () => {
  it('defaults to one hour, capped by the end of the day', () => {
    expect(rangeStartingAt(14 * 60, [])).toEqual({ start: '14:00', end: '15:00' });
    expect(rangeStartingAt(17 * 60 + 30, [])).toEqual({ start: '17:30', end: '18:00' });
  });
});

describe('buildDaySlots', () => {
  it('marks busy, past and free slots', () => {
    const slots = buildDaySlots(
      TODAY,
      [{ id: 'a', date: TODAY, start: '13:00', end: '14:00' }],
      NOW,
    );
    const status = (start: string) => slots.find((s) => s.start === start)?.status;
    expect(slots).toHaveLength(18);
    expect(status('09:00')).toBe('past');
    expect(status('12:00')).toBe('past');
    expect(status('12:30')).toBe('free');
    expect(status('13:30')).toBe('busy');
    expect(status('14:00')).toBe('free');
  });
});
