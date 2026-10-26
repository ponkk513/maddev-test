import { useRef } from 'react';
import { BookingList, isPastDate, useBookings, type Booking } from '@/entities/booking';
import { DeleteBookingDialog, useDeleteBookingFlow } from '@/features/delete-booking';
import { useNotify } from '@/shared/ui';

type Props = {
  date: string;
  now: Date;
  editingId?: string;
  onEdit: (booking: Booking) => void;
  onDeleted: (booking: Booking) => void;
};

export function DayBookings({ date, now, editingId, onEdit, onDeleted }: Props) {
  const query = useBookings(date);
  const notify = useNotify();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const deletion = useDeleteBookingFlow({
    onDeleted: (booking, message) => {
      notify(message);
      onDeleted(booking);
      requestAnimationFrame(() => titleRef.current?.focus());
    },
  });

  const bookings = query.data ?? [];

  return (
    <section className="card" aria-labelledby="list-title">
      <h2 id="list-title" className="card__title" ref={titleRef} tabIndex={-1}>
        Брони на день
        {query.data && <span className="muted"> · {bookings.length}</span>}
      </h2>

      {query.isPending ? (
        <p className="muted">Загрузка…</p>
      ) : query.isError && !query.data ? (
        <p className="muted">Список недоступен.</p>
      ) : bookings.length === 0 ? (
        <p className="empty">
          {isPastDate(date, now)
            ? 'В этот день бронирований не было.'
            : 'Броней нет — комната свободна весь день.'}
        </p>
      ) : (
        <BookingList
          bookings={bookings}
          now={now}
          highlightedId={editingId}
          renderActions={(b) => {
            const label = `${b.start}–${b.end}${b.title ? `, ${b.title}` : ''}`;
            if (b.id === editingId)
              return <span className="badge badge--accent">Редактируется</span>;
            return (
              <div className="booking-item__actions">
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => onEdit(b)}
                  aria-label={`Изменить бронь ${label}`}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="btn btn--small btn--danger"
                  onClick={() => deletion.request(b)}
                  aria-label={`Удалить бронь ${label}`}
                >
                  Удалить
                </button>
              </div>
            );
          }}
        />
      )}

      <DeleteBookingDialog flow={deletion} />
    </section>
  );
}
