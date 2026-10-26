import type { ReactNode } from 'react';
import { formatDuration, minutesOfDay, toMinutes } from '@/shared/lib';
import { isBookingLocked, isToday } from '../model/rules';
import type { Booking } from '../model/types';

type Props = {
  bookings: Booking[];
  now: Date;
  highlightedId?: string;
  /** Slot for actions on an editable booking (provided by features). */
  renderActions: (booking: Booking) => ReactNode;
};

function lockedStatus(b: Booking, now: Date): string | null {
  if (!isBookingLocked(b, now)) return null;
  const inProgress = isToday(b.date, now) && minutesOfDay(now) < toMinutes(b.end);
  return inProgress ? 'Идёт сейчас' : 'Прошла';
}

export function BookingList({ bookings, now, highlightedId, renderActions }: Props) {
  return (
    <ul className="booking-list">
      {bookings.map((b) => {
        const status = lockedStatus(b, now);
        const highlighted = b.id === highlightedId;
        return (
          <li key={b.id} className={`booking-item ${highlighted ? 'booking-item--editing' : ''}`}>
            <div className="booking-item__info">
              <span className="booking-item__time">
                {b.start}–{b.end}
                <span className="muted">
                  {' · '}
                  {formatDuration(toMinutes(b.end) - toMinutes(b.start))}
                </span>
              </span>
              <span className="booking-item__title">
                {b.title || <i className="muted">Без названия</i>}
              </span>
            </div>
            {status ? <span className="badge">{status}</span> : renderActions(b)}
          </li>
        );
      })}
    </ul>
  );
}
