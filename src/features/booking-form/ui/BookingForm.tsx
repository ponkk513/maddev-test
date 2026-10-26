import { useEffect, useId, useRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { buildTimeOptions, TITLE_MAX_LENGTH } from '@/entities/booking';
import { formatDuration } from '@/shared/lib';
import type { BookingFormModel } from '../model/useBookingForm';

type Props = {
  model: BookingFormModel;
  date: string;
  now: Date;
};

export function BookingForm({ model, date, now }: Props) {
  const id = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const { form, fields, mode, serverError, isSubmitting } = model;
  const { errors } = form.formState;
  const isEdit = mode.kind === 'edit';

  const { setFocus } = form;
  useEffect(() => {
    if (!model.editingId) return;
    sectionRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    setFocus('start');
  }, [model.editingId, setFocus]);

  const serverMessage = serverError?.message;
  useEffect(() => {
    if (serverMessage) alertRef.current?.focus();
  }, [serverMessage]);

  const title = isEdit ? 'Редактирование брони' : 'Новая бронь';

  if (model.pastDate && !isEdit) {
    return (
      <section className="card" aria-labelledby={`${id}-title`}>
        <h2 id={`${id}-title`} className="card__title">
          {title}
        </h2>
        <p className="notice">
          Нельзя бронировать на прошедшую дату. Выберите сегодняшнюю или будущую дату.
        </p>
      </section>
    );
  }

  const errorId = (field: string) => `${id}-${field}-error`;
  const describedBy = (field: 'start' | 'end' | 'title') =>
    errors[field] ? errorId(field) : undefined;

  return (
    <section ref={sectionRef} className="card" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="card__title">
        {title}
      </h2>

      {model.noFreeTime && (
        <p className="notice">На эту дату свободного времени для бронирования не осталось.</p>
      )}

      <form onSubmit={model.submit} noValidate aria-busy={isSubmitting || !model.ready}>
        <fieldset className="form__fieldset" disabled={!model.ready}>
          <div className="form__row">
            <TimeSelect
              id={`${id}-start`}
              label="Начало"
              options={buildTimeOptions('start', date, now)}
              registration={fields.start}
              empty={!model.values.start}
              error={errors.start?.message}
              errorId={errorId('start')}
              describedBy={describedBy('start')}
            />
            <TimeSelect
              id={`${id}-end`}
              label="Окончание"
              options={buildTimeOptions('end', date, now)}
              registration={fields.end}
              empty={!model.values.end}
              error={errors.end?.message}
              errorId={errorId('end')}
              describedBy={describedBy('end')}
            />
          </div>

          {model.duration > 0 && !errors.end && !errors.start && (
            <p className="field__hint">Длительность: {formatDuration(model.duration)}</p>
          )}

          <div className="field">
            <label htmlFor={`${id}-title-input`}>
              Название <span className="muted">(необязательно)</span>
            </label>
            <input
              id={`${id}-title-input`}
              type="text"
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Например, планёрка"
              autoComplete="off"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={describedBy('title')}
              {...fields.title}
            />
            {errors.title && (
              <p id={errorId('title')} className="field__error">
                {errors.title.message}
              </p>
            )}
          </div>

          {serverError && (
            <div
              ref={alertRef}
              tabIndex={-1}
              role="alert"
              className={`alert ${serverError.kind === 'conflict' ? 'alert--warning' : 'alert--error'}`}
            >
              {serverError.message}
            </div>
          )}

          <div className="form__actions">
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение…' : isEdit ? 'Сохранить изменения' : 'Забронировать'}
            </button>
            {model.canReset && (
              <button type="button" className="btn" onClick={model.cancel} disabled={isSubmitting}>
                {isEdit ? 'Отменить' : 'Сбросить'}
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}

type TimeSelectProps = {
  id: string;
  label: string;
  options: { value: string; disabled: boolean }[];
  registration: UseFormRegisterReturn<'start' | 'end'>;
  empty: boolean;
  error?: string;
  errorId: string;
  describedBy?: string;
};

function TimeSelect({
  id,
  label,
  options,
  registration,
  empty,
  error,
  errorId,
  describedBy,
}: TimeSelectProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...registration}
      >
        {empty && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.value}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
