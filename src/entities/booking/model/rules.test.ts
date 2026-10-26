import type { Booking, BookingDraft } from './types';
import { findConflicts, isBookingLocked, overlaps, validateDraft } from './rules';

// Monday, 4 March 2030, 12:10 local time.
const NOW = new Date(2030, 2, 4, 12, 10);
const TODAY = '2030-03-04';
const TOMORROW = '2030-03-05';

const draft = (start: string, end: string, date = TOMORROW): BookingDraft => ({ date, start, end });
const codes = (d: BookingDraft) => validateDraft(d, NOW).map((i) => i.code);

describe('overlaps', () => {
  it('detects intersections', () => {
    expect(overlaps({ start: '10:00', end: '11:00' }, { start: '10:30', end: '11:30' })).toBe(true);
    expect(overlaps({ start: '10:00', end: '12:00' }, { start: '10:30', end: '11:00' })).toBe(true);
    expect(overlaps({ start: '10:00', end: '11:00' }, { start: '10:00', end: '11:00' })).toBe(true);
  });

  it('does not treat touching borders as a conflict', () => {
    expect(overlaps({ start: '10:00', end: '11:00' }, { start: '11:00', end: '12:00' })).toBe(
      false,
    );
    expect(overlaps({ start: '11:00', end: '12:00' }, { start: '10:00', end: '11:00' })).toBe(
      false,
    );
  });
});

describe('findConflicts', () => {
  const bookings: Booking[] = [
    { id: 'a', date: TOMORROW, start: '10:00', end: '11:00' },
    { id: 'b', date: '2030-03-06', start: '10:00', end: '11:00' },
  ];

  it('only considers bookings of the same date', () => {
    expect(findConflicts(draft('10:30', '11:30'), bookings).map((b) => b.id)).toEqual(['a']);
  });

  it('excludes the booking being edited (no conflict with itself)', () => {
    expect(findConflicts(draft('10:15', '11:15'), bookings, 'a')).toEqual([]);
  });
});

describe('validateDraft', () => {
  it('accepts a valid booking', () => {
    expect(codes(draft('10:00', '11:00'))).toEqual([]);
  });

  it('accepts exact boundaries of the working day and of durations', () => {
    expect(codes(draft('09:00', '09:30'))).toEqual([]); // min 30 min, day start
    expect(codes(draft('16:00', '18:00'))).toEqual([]); // max 2 h, day end
  });

  it('rejects time outside the working day', () => {
    expect(codes(draft('08:30', '09:30'))).toContain('OUTSIDE_WORKING_HOURS');
    expect(codes(draft('17:30', '18:30'))).toContain('OUTSIDE_WORKING_HOURS');
  });

  it('requires start < end', () => {
    expect(codes(draft('11:00', '10:00'))).toEqual(['START_NOT_BEFORE_END']);
    expect(codes(draft('11:00', '11:00'))).toEqual(['START_NOT_BEFORE_END']);
  });

  it('enforces min and max duration', () => {
    expect(codes(draft('10:00', '10:15'))).toEqual(['TOO_SHORT']);
    expect(codes(draft('10:00', '12:15'))).toEqual(['TOO_LONG']);
  });

  it('rejects past dates', () => {
    expect(codes(draft('10:00', '11:00', '2030-03-03'))).toEqual(['PAST_DATE']);
  });

  it('rejects past time today, but allows the future part of today', () => {
    expect(codes(draft('12:00', '13:00', TODAY))).toEqual(['PAST_TIME']);
    expect(codes(draft('12:10', '13:00', TODAY))).toEqual([]);
    expect(codes(draft('12:15', '13:00', TODAY))).toEqual([]);
  });

  it('rejects malformed values', () => {
    expect(codes({ date: '2030-02-30', start: '10:00', end: '11:00' })).toEqual(['INVALID_FORMAT']);
    expect(codes(draft('9:00', '25:00'))).toEqual(['INVALID_FORMAT', 'INVALID_FORMAT']);
  });

  it('limits title length', () => {
    expect(codes({ ...draft('10:00', '11:00'), title: 'x'.repeat(81) })).toEqual([
      'TITLE_TOO_LONG',
    ]);
  });
});

describe('isBookingLocked', () => {
  it('locks started and past bookings', () => {
    expect(isBookingLocked({ id: '1', date: TODAY, start: '12:00', end: '13:00' }, NOW)).toBe(true);
    expect(
      isBookingLocked({ id: '1', date: '2030-03-01', start: '15:00', end: '16:00' }, NOW),
    ).toBe(true);
  });

  it('keeps future bookings editable', () => {
    expect(isBookingLocked({ id: '1', date: TODAY, start: '12:30', end: '13:00' }, NOW)).toBe(
      false,
    );
  });
});
