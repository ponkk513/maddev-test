import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  isPastDate,
  rangeStartingAt,
  suggestFreeRange,
  useCreateBooking,
  useUpdateBooking,
  type Booking,
} from '@/entities/booking';
import { toMinutes } from '@/shared/lib';
import {
  createBookingFormSchema,
  EMPTY_VALUES,
  toDraft,
  toPatch,
  toValues,
  type BookingFormValues,
} from './schema';
import { toServerError, type ServerErrorKind } from './serverError';

const FIELD_NAMES: (keyof BookingFormValues)[] = ['start', 'end', 'title'];

export type BookingFormMode = { kind: 'create' } | { kind: 'edit'; booking: Booking };

type Options = {
  date: string;
  now: Date;
  bookings: Booking[];
  ready: boolean;
  onSaved: (booking: Booking, mode: BookingFormMode['kind']) => void;
};

export function useBookingForm({ date, now, bookings, ready, onSaved }: Options) {
  const [mode, setMode] = useState<BookingFormMode>({ kind: 'create' });
  // While pristine, values follow external data (a free slot or the edited booking).
  // After any input or submit they belong to the user and survive refetches, e.g. after a 409.
  const [pristine, setPristine] = useState(true);
  const editing = mode.kind === 'edit' ? mode.booking : undefined;

  const createMutation = useCreateBooking();
  const updateMutation = useUpdateBooking();

  const suggestion = useMemo(
    () => (ready ? suggestFreeRange(date, bookings, now) : null),
    [ready, date, bookings, now],
  );

  function valuesFor(next: BookingFormMode): BookingFormValues {
    if (next.kind === 'edit') return toValues(next.booking);
    return suggestion ? { ...EMPTY_VALUES, ...suggestion } : EMPTY_VALUES;
  }

  const schema = createBookingFormSchema({ date, now, bookings, excludeId: editing?.id });

  const form = useForm<BookingFormValues>({
    values: pristine ? valuesFor(mode) : undefined,
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  // Revalidate when bookings change under the input. Names are explicit: a bare trigger()
  // replaces all errors and would wipe the server error (root.server).
  useEffect(() => {
    if (!pristine) void form.trigger(FIELD_NAMES);
  }, [date, bookings, pristine, form]);

  function resetTo(next: BookingFormMode) {
    setMode(next);
    setPristine(true);
    form.reset(valuesFor(next));
  }

  function markTouched() {
    setPristine(false);
    form.clearErrors('root.server');
  }

  const fields = {
    start: form.register('start', { onChange: markTouched, deps: ['end'] }),
    end: form.register('end', { onChange: markTouched, deps: ['start'] }),
    title: form.register('title', { onChange: markTouched }),
  };

  const onValid = form.handleSubmit(async (values) => {
    try {
      const saved = editing
        ? await updateMutation.mutateAsync({ id: editing.id, date, patch: toPatch(values) })
        : await createMutation.mutateAsync(toDraft(values, date));
      onSaved(saved, mode.kind);
      resetTo({ kind: 'create' });
    } catch (error) {
      const serverError = toServerError(error, Boolean(editing));
      form.setError('root.server', { type: serverError.kind, message: serverError.message });
      if (serverError.kind === 'gone') setMode({ kind: 'create' });
    }
  });

  function submit(event?: FormEvent) {
    setPristine(false);
    return onValid(event);
  }

  function pickSlot(start: string) {
    const range = rangeStartingAt(toMinutes(start), bookings, editing?.id);
    markTouched();
    form.setValue('start', range.start, { shouldDirty: true });
    form.setValue('end', range.end, { shouldDirty: true, shouldValidate: true });
    void form.trigger('start');
  }

  const watched = useWatch({ control: form.control });
  const current = { ...EMPTY_VALUES, ...watched };
  const pastDate = isPastDate(date, now);
  const showPreview = !pastDate && (mode.kind === 'edit' || !pristine);
  const serverError = form.formState.errors.root?.server;

  return {
    form,
    fields,
    mode,
    editingId: editing?.id,
    ready,
    pastDate,
    noFreeTime: ready && !editing && suggestion === null && pristine,
    values: current,
    isSubmitting: form.formState.isSubmitting,
    serverError: serverError?.message
      ? { kind: serverError.type as ServerErrorKind, message: serverError.message }
      : null,
    duration: current.start && current.end ? toMinutes(current.end) - toMinutes(current.start) : 0,
    preview: showPreview
      ? {
          start: current.start,
          end: current.end,
          invalid: !schema.safeParse(current).success,
        }
      : null,
    canReset: mode.kind === 'edit' || !pristine,
    submit,
    pickSlot,
    startEdit: (booking: Booking) => resetTo({ kind: 'edit', booking }),
    cancel: () => resetTo({ kind: 'create' }),
    onDateChange: () => {
      if (mode.kind === 'edit') resetTo({ kind: 'create' });
    },
  };
}

export type BookingFormModel = ReturnType<typeof useBookingForm>;
