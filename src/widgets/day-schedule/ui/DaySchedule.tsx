import { isPastDate, useBookings, type Booking, type TimeRange } from '@/entities/booking';
import { getErrorMessage } from '@/shared/api';
import { ErrorState } from '@/shared/ui';
import { DayTimeline } from './DayTimeline';

const NO_BOOKINGS: Booking[] = [];

type Props = {
  date: string;
  now: Date;
  editingId?: string;
  preview: (TimeRange & { invalid: boolean }) | null;
  onPickSlot: (start: string) => void;
  onEdit: (booking: Booking) => void;
};

export function DaySchedule({ date, now, editingId, preview, onPickSlot, onEdit }: Props) {
  const query = useBookings(date);
  const retry = () => void query.refetch();

  return (
    <section
      className="card schedule"
      aria-labelledby="schedule-title"
      aria-busy={query.isFetching}
    >
      <div className="card__head">
        <h2 id="schedule-title" className="card__title">
          Расписание 09:00–18:00
        </h2>
        {query.isFetching && !query.isPending && <span className="muted small">Обновление…</span>}
      </div>

      {query.isPending ? (
        <div className="skeleton" aria-label="Загрузка расписания" role="progressbar" />
      ) : query.isError && !query.data ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={retry} />
      ) : (
        <>
          {query.isError && (
            <ErrorState
              compact
              message={`Не удалось обновить расписание. ${getErrorMessage(query.error)}`}
              onRetry={retry}
            />
          )}
          <DayTimeline
            date={date}
            bookings={query.data ?? NO_BOOKINGS}
            now={now}
            editingId={editingId}
            interactive={!isPastDate(date, now)}
            preview={preview}
            onPickSlot={onPickSlot}
            onEdit={onEdit}
          />
        </>
      )}
    </section>
  );
}
