import { useId } from 'react';
import { addDays, formatHumanDate, isValidDate, toISODate } from '@/shared/lib';

type Props = {
  date: string;
  now: Date;
  onChange: (date: string) => void;
};

export function DateNav({ date, now, onChange }: Props) {
  const id = useId();
  const today = toISODate(now);

  return (
    <div className="date-nav">
      <div className="date-nav__controls">
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => onChange(addDays(date, -1))}
          aria-label="Предыдущий день"
        >
          ‹
        </button>
        <label htmlFor={`${id}-date`} className="visually-hidden">
          Дата
        </label>
        <input
          id={`${id}-date`}
          type="date"
          className="date-nav__input"
          value={date}
          required
          onChange={(e) => {
            // Ignore an intermediate/empty value while the user types in the native picker.
            if (isValidDate(e.target.value)) onChange(e.target.value);
          }}
        />
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => onChange(addDays(date, 1))}
          aria-label="Следующий день"
        >
          ›
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => onChange(today)}
          disabled={date === today}
        >
          Сегодня
        </button>
      </div>
      <p className="date-nav__human" aria-live="polite">
        {formatHumanDate(date)}
      </p>
    </div>
  );
}
