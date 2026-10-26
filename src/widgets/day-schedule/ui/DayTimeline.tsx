import type { CSSProperties } from 'react';
import {
  buildDaySlots,
  isBookingLocked,
  isToday,
  SLOT_SIZE_MIN,
  WORKDAY_END,
  WORKDAY_START,
  type Booking,
  type TimeRange,
} from '@/entities/booking';
import { minutesOfDay, toMinutes } from '@/shared/lib';

type Props = {
  date: string;
  bookings: Booking[];
  now: Date;
  editingId?: string;
  preview: (TimeRange & { invalid: boolean }) | null;
  /** Whether creating is possible at all (e.g. not a past date). */
  interactive: boolean;
  onPickSlot: (start: string) => void;
  onEdit: (booking: Booking) => void;
};

const DAY_START = toMinutes(WORKDAY_START);
const DAY_END = toMinutes(WORKDAY_END);

/** Position on the grid in slot units — CSS turns it into pixels via --slot-h. */
function place(range: TimeRange): CSSProperties {
  const top = (toMinutes(range.start) - DAY_START) / SLOT_SIZE_MIN;
  const height = (toMinutes(range.end) - toMinutes(range.start)) / SLOT_SIZE_MIN;
  return { '--top': top, '--height': height } as CSSProperties;
}

export function DayTimeline({
  date,
  bookings,
  now,
  editingId,
  preview,
  interactive,
  onPickSlot,
  onEdit,
}: Props) {
  const slots = buildDaySlots(date, bookings, now, editingId);
  const nowMin = minutesOfDay(now);
  const showNowLine = isToday(date, now) && nowMin >= DAY_START && nowMin <= DAY_END;

  return (
    <div className="timeline" role="group" aria-label="Слоты рабочего дня">
      <ol className="timeline__slots">
        {slots.map((slot) => {
          const isHour = slot.start.endsWith(':00');
          return (
            <li key={slot.start} className={`timeline__row ${isHour ? 'timeline__row--hour' : ''}`}>
              <span className="timeline__label" aria-hidden={!isHour}>
                {isHour ? slot.start : ''}
              </span>
              {slot.status === 'free' && interactive ? (
                <button
                  type="button"
                  className="timeline__slot timeline__slot--free"
                  onClick={() => onPickSlot(slot.start)}
                  aria-label={`Выбрать время с ${slot.start}`}
                >
                  <span className="timeline__slot-text">{slot.start} · свободно</span>
                </button>
              ) : (
                <span
                  className={`timeline__slot timeline__slot--${slot.status === 'free' ? 'past' : slot.status}`}
                >
                  <span className="visually-hidden">
                    {slot.start}–{slot.end}: {slot.status === 'busy' ? 'занято' : 'недоступно'}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/*
        Booking blocks duplicate the accessible list below,
        so they are hidden from assistive tech; for mouse/touch they are a shortcut to editing.
      */}
      <div className="timeline__overlay" aria-hidden="true">
        {bookings.map((b) => {
          const locked = isBookingLocked(b, now);
          const editing = b.id === editingId;
          // Clicking the booking being edited would restart editing and drop unsaved changes.
          const clickable = !locked && !editing;
          return (
            // Mouse/touch shortcut only: keyboard and screen-reader users get the same
            // action via the "Изменить" buttons in the bookings list.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div
              key={b.id}
              className={[
                'timeline__booking',
                locked && 'timeline__booking--locked',
                editing && 'timeline__booking--editing',
              ]
                .filter(Boolean)
                .join(' ')}
              style={place(b)}
              onClick={clickable ? () => onEdit(b) : undefined}
              title={clickable ? 'Нажмите, чтобы изменить' : undefined}
            >
              <span className="timeline__booking-time">
                {b.start}–{b.end}
              </span>
              <span className="timeline__booking-title">{b.title || 'Без названия'}</span>
            </div>
          );
        })}

        {preview && toMinutes(preview.start) < toMinutes(preview.end) && (
          <div
            className={`timeline__preview ${preview.invalid ? 'timeline__preview--invalid' : ''}`}
            style={place(preview)}
          >
            {preview.start}–{preview.end}
          </div>
        )}

        {showNowLine && (
          <div
            className="timeline__now"
            style={{ '--top': (nowMin - DAY_START) / SLOT_SIZE_MIN } as CSSProperties}
          />
        )}
      </div>
    </div>
  );
}
