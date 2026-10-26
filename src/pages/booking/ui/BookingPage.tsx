import { useBookings, type Booking } from '@/entities/booking';
import { BookingForm, useBookingForm } from '@/features/booking-form';
import { DateNav, useDateParam } from '@/features/select-date';
import { toISODate, useNow } from '@/shared/lib';
import { useNotify } from '@/shared/ui';
import { DayBookings } from '@/widgets/day-bookings';
import { DaySchedule } from '@/widgets/day-schedule';

const NO_BOOKINGS: Booking[] = [];

/** Composition only: the page wires widgets and features together, logic lives in the slices. */
export function BookingPage() {
  const now = useNow();
  const notify = useNotify();
  const [date, setDate] = useDateParam(toISODate(now), () => bookingForm.onDateChange());

  const { data: bookings = NO_BOOKINGS, isPending } = useBookings(date);

  const bookingForm = useBookingForm({
    date,
    now,
    bookings,
    ready: !isPending,
    onSaved: (b, mode) =>
      notify(`Бронь ${b.start}–${b.end} ${mode === 'edit' ? 'обновлена' : 'создана'}`),
  });

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Переговорная</h1>
        <DateNav date={date} now={now} onChange={setDate} />
      </header>

      <main className="page__main">
        <DaySchedule
          date={date}
          now={now}
          editingId={bookingForm.editingId}
          preview={bookingForm.preview}
          onPickSlot={bookingForm.pickSlot}
          onEdit={bookingForm.startEdit}
        />

        <div className="sidebar">
          <BookingForm model={bookingForm} date={date} now={now} />
          <DayBookings
            date={date}
            now={now}
            editingId={bookingForm.editingId}
            onEdit={bookingForm.startEdit}
            onDeleted={(b) => {
              if (b.id === bookingForm.editingId) bookingForm.cancel();
            }}
          />
        </div>
      </main>
    </div>
  );
}
