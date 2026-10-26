import { delay, http, HttpResponse } from 'msw';
import type { ZodType } from 'zod';
import {
  bookingDraftSchema,
  bookingPatchSchema,
  findConflicts,
  formatBookings,
  isBookingLocked,
  MIN_DURATION_MIN,
  sortByStart,
  validateDraft,
  type Booking,
  type BookingDraft,
  type BookingErrorBody,
} from '@/entities/booking';
import { fromMinutes, isValidDate, toMinutes } from '@/shared/lib';
import { mockSettings } from './devTools';
import { type BookingStore, createId } from './store';

type HandlerOptions = {
  store: BookingStore;
  now?: () => Date;
};

const error = (status: number, body: BookingErrorBody) => HttpResponse.json(body, { status });

const notFound = () =>
  error(404, { code: 'NOT_FOUND', message: 'Бронь не найдена — возможно, её уже удалили' });

function normalizeTitle(title: string | undefined): string | undefined {
  const trimmed = title?.trim();
  return trimmed ? trimmed : undefined;
}

async function parseBody<T>(request: Request, schema: ZodType<T>) {
  const json: unknown = await request.json().catch(() => undefined);
  return schema.safeParse(json);
}

const badRequest = () => error(400, { code: 'BAD_REQUEST', message: 'Некорректное тело запроса' });

export function createHandlers({ store, now = () => new Date() }: HandlerOptions) {
  async function prelude() {
    const { latencyMs, serverDown } = mockSettings.get();
    if (latencyMs > 0) await delay(latencyMs);
    if (serverDown) return error(500, { code: 'INTERNAL', message: 'Internal server error' });
    return null;
  }

  function maybeSimulateRace(draft: BookingDraft) {
    if (!mockSettings.takeConflictSimulation()) return;
    store.insert({
      id: createId(),
      date: draft.date,
      start: draft.start,
      end: fromMinutes(Math.min(toMinutes(draft.start) + MIN_DURATION_MIN, toMinutes(draft.end))),
      title: 'Бронь другого сотрудника',
    });
  }

  function check(draft: BookingDraft, excludeId?: string) {
    const issues = validateDraft(draft, now());
    if (issues.length > 0) {
      return error(422, {
        code: 'VALIDATION',
        message: issues.map((i) => i.message).join('. '),
        issues,
      });
    }
    maybeSimulateRace(draft);
    const conflicts = findConflicts(draft, store.byDate(draft.date), excludeId);
    if (conflicts.length > 0) {
      return error(409, {
        code: 'CONFLICT',
        message: `Время пересекается с бронью ${formatBookings(conflicts)}`,
        conflicts,
      });
    }
    return null;
  }

  return [
    http.get('*/api/bookings', async ({ request }) => {
      const failed = await prelude();
      if (failed) return failed;

      const date = new URL(request.url).searchParams.get('date');
      if (!isValidDate(date)) {
        return error(400, {
          code: 'BAD_REQUEST',
          message: 'Параметр date должен быть в формате YYYY-MM-DD',
        });
      }
      return HttpResponse.json(sortByStart(store.byDate(date)));
    }),

    http.post('*/api/bookings', async ({ request }) => {
      const failed = await prelude();
      if (failed) return failed;

      const body = await parseBody(request, bookingDraftSchema);
      if (!body.success) return badRequest();

      const draft: BookingDraft = { ...body.data, title: normalizeTitle(body.data.title) };
      const rejected = check(draft);
      if (rejected) return rejected;

      const booking: Booking = { id: createId(), ...draft };
      store.insert(booking);
      return HttpResponse.json(booking, { status: 201 });
    }),

    http.patch('*/api/bookings/:id', async ({ request, params }) => {
      const failed = await prelude();
      if (failed) return failed;

      const existing = store.get(String(params.id));
      if (!existing) return notFound();
      if (isBookingLocked(existing, now())) {
        return error(422, {
          code: 'BOOKING_LOCKED',
          message: 'Начавшуюся или прошедшую бронь изменить нельзя',
        });
      }

      const body = await parseBody(request, bookingPatchSchema);
      if (!body.success) return badRequest();

      const merged: Booking = {
        ...existing,
        ...body.data,
        // '' clears the title, an absent field keeps it.
        title: normalizeTitle(body.data.title ?? existing.title),
      };
      const rejected = check(merged, existing.id);
      if (rejected) return rejected;

      store.replace(merged);
      return HttpResponse.json(merged);
    }),

    http.delete('*/api/bookings/:id', async ({ params }) => {
      const failed = await prelude();
      if (failed) return failed;

      const existing = store.get(String(params.id));
      if (!existing) return notFound();
      if (isBookingLocked(existing, now())) {
        return error(422, {
          code: 'BOOKING_LOCKED',
          message: 'Начавшуюся или прошедшую бронь удалить нельзя',
        });
      }
      store.delete(existing.id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
