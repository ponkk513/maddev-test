import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createHttpClient } from '@/shared/api';
import { createHttpBookingsApi } from './bookingsApi';
import { getConflicts, isConflictError, isNotFoundError } from './errors';

// A backend that follows the contract from the assignment but not the mock's extras:
// plain error bodies, `title: null`, extra fields, 200 with an empty body on DELETE.
const server = setupServer(
  http.get('http://backend.test/api/bookings', () =>
    HttpResponse.json([
      { id: '1', date: '2030-03-05', start: '10:00', end: '11:00', title: null, createdBy: 'x' },
    ]),
  ),
  http.post('http://backend.test/api/bookings', () =>
    HttpResponse.json({ error: 'Slot is already taken' }, { status: 409 }),
  ),
  http.patch(
    'http://backend.test/api/bookings/:id',
    () => new HttpResponse('Not Found', { status: 404 }),
  ),
  http.delete(
    'http://backend.test/api/bookings/:id',
    () => new HttpResponse(null, { status: 200 }),
  ),
  http.get('http://localhost:3000/backend/api/bookings', () => HttpResponse.json([])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

const api = createHttpBookingsApi(createHttpClient('http://backend.test'));
const draft = { date: '2030-03-05', start: '10:00', end: '11:00' };

describe('bookings API against a third-party backend', () => {
  it('accepts null titles and ignores unknown fields', async () => {
    expect(await api.list('2030-03-05')).toEqual([
      { id: '1', date: '2030-03-05', start: '10:00', end: '11:00', title: undefined },
    ]);
  });

  it('detects a conflict by the 409 status, whatever the body', async () => {
    const error = await api.create(draft).catch((e: unknown) => e);
    expect(isConflictError(error)).toBe(true);
    expect(getConflicts(error)).toEqual([]);
  });

  it('detects "not found" by the 404 status', async () => {
    const error = await api.update('1', { end: '11:30' }).catch((e: unknown) => e);
    expect(isNotFoundError(error)).toBe(true);
  });

  it('treats any 2xx on DELETE as success', async () => {
    await expect(api.remove('1')).resolves.toBeUndefined();
  });

  it('supports a base URL relative to the page origin (e.g. behind a proxy)', async () => {
    const proxied = createHttpBookingsApi(createHttpClient('/backend'));
    await expect(proxied.list('2030-03-05')).resolves.toEqual([]);
  });
});
