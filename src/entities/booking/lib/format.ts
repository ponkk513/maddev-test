import type { Booking } from '../model/types';

/** "10:00–11:00 «Daily»" */
export function formatBooking(b: Pick<Booking, 'start' | 'end' | 'title'>): string {
  return `${b.start}–${b.end}${b.title ? ` «${b.title}»` : ''}`;
}

export function formatBookings(bookings: readonly Booking[]): string {
  return bookings.map(formatBooking).join(', ');
}
