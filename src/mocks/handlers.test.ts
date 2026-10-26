import {
  createHttpBookingsApi,
  getConflicts,
  getValidationIssues,
  type Booking,
} from '@/entities/booking';
import { ApiError, createHttpClient } from '@/shared/api';
import { createTestServer } from '@/test/server';
import { mockSettings } from './devTools';

const DATE = '2030-03-05';
const existing: Booking = { id: 'a', date: DATE, start: '10:00', end: '11:00', title: 'Дейли' };

const { server, store } = createTestServer();
const api = createHttpBookingsApi(createHttpClient('http://localhost'));

async function expectApiError(promise: Promise<unknown>, status: number, code: string) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ status, code });
  return error as ApiError;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2030, 2, 4, 12, 0));
  store.replaceAll([existing]);
});
afterEach(() => vi.useRealTimers());

describe('mock bookings API', () => {
  it('lists bookings by date', async () => {
    expect(await api.list(DATE)).toEqual([existing]);
    expect(await api.list('2030-03-06')).toEqual([]);
  });

  it('rejects a malformed date with 400', async () => {
    await expectApiError(api.list('05.03.2030'), 400, 'BAD_REQUEST');
  });

  it('creates a booking touching an existing one', async () => {
    const created = await api.create({
      date: DATE,
      start: '11:00',
      end: '12:00',
      title: '  Встреча ',
    });
    expect(created).toMatchObject({ date: DATE, start: '11:00', end: '12:00', title: 'Встреча' });
    expect(await api.list(DATE)).toHaveLength(2);
  });

  it('returns 409 with the conflicting bookings on overlap', async () => {
    const error = await expectApiError(
      api.create({ date: DATE, start: '10:30', end: '11:30' }),
      409,
      'CONFLICT',
    );
    expect(getConflicts(error)).toEqual([existing]);
  });

  it('validates business rules on the server (422)', async () => {
    const error = await expectApiError(
      api.create({ date: DATE, start: '17:00', end: '19:30' }),
      422,
      'VALIDATION',
    );
    expect(getValidationIssues(error).map((i) => i.code)).toEqual([
      'OUTSIDE_WORKING_HOURS',
      'TOO_LONG',
    ]);
    await expectApiError(
      api.create({ date: '2030-03-03', start: '10:00', end: '11:00' }),
      422,
      'VALIDATION',
    );
  });

  it('rejects a malformed body with 400 (shape is checked by the contract schema)', async () => {
    const response = await fetch('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ date: DATE, start: 10 }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('lets an edited booking overlap its own previous time', async () => {
    const updated = await api.update('a', { start: '10:30', end: '11:30' });
    expect(updated).toMatchObject({ id: 'a', start: '10:30', end: '11:30', title: 'Дейли' });
  });

  it('clears the title when an empty string is sent', async () => {
    const updated = await api.update('a', { title: '' });
    expect(updated.title).toBeUndefined();
  });

  it('returns 404 for unknown ids', async () => {
    await expectApiError(api.update('nope', { start: '12:00' }), 404, 'NOT_FOUND');
    await expectApiError(api.remove('nope'), 404, 'NOT_FOUND');
  });

  it('does not allow changing a booking that already started', async () => {
    store.insert({ id: 'started', date: '2030-03-04', start: '11:30', end: '12:30' });
    await expectApiError(api.update('started', { end: '13:00' }), 422, 'BOOKING_LOCKED');
    await expectApiError(api.remove('started'), 422, 'BOOKING_LOCKED');
  });

  it('deletes a booking', async () => {
    await api.remove('a');
    expect(await api.list(DATE)).toEqual([]);
  });

  it('simulates a race: another user takes the slot right before the write', async () => {
    mockSettings.set({ simulateConflictOnNextWrite: true });
    const error = await expectApiError(
      api.create({ date: DATE, start: '14:00', end: '15:00' }),
      409,
      'CONFLICT',
    );
    expect(getConflicts(error)[0]).toMatchObject({ start: '14:00', end: '14:30' });
    expect(mockSettings.get().simulateConflictOnNextWrite).toBe(false);
  });

  it('simulates a server outage until it is switched off', async () => {
    mockSettings.set({ serverDown: true });
    await expectApiError(api.list(DATE), 500, 'INTERNAL');
    await expectApiError(api.create({ date: DATE, start: '14:00', end: '15:00' }), 500, 'INTERNAL');
    mockSettings.set({ serverDown: false });
    expect(await api.list(DATE)).toEqual([existing]);
  });
});
