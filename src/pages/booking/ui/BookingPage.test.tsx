import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/app/App';
import { createQueryClient } from '@/app/providers/queryClient';
import type { Booking } from '@/entities/booking';
import { mockSettings } from '@/mocks/devTools';
import { createTestServer } from '@/test/server';

const TODAY = '2030-03-04';
const daily: Booking = { id: 'a', date: TODAY, start: '10:00', end: '11:00', title: 'Дейли' };

const { server, store } = createTestServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2030, 2, 4, 8, 0));
  window.history.replaceState(null, '', '/');
  store.replaceAll([daily]);
  mockSettings.set({ simulateConflictOnNextWrite: false, serverDown: false });
});
afterEach(() => vi.useRealTimers());

function renderApp() {
  const user = userEvent.setup();
  render(<App queryClient={createQueryClient()} />);
  return user;
}

const list = () => screen.getByRole('region', { name: /Брони на день/ });

describe('BookingPage', () => {
  it('shows existing bookings for the selected date', async () => {
    renderApp();
    expect(await within(list()).findByText('Дейли')).toBeInTheDocument();
    expect(within(list()).getByText(/10:00–11:00/)).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    store.replaceAll([]);
    renderApp();
    expect(await screen.findByText(/комната свободна весь день/)).toBeInTheDocument();
  });

  it('shows an error state with retry', async () => {
    mockSettings.set({ serverDown: true });
    const user = renderApp();
    // The query client retries once on 5xx (with a ~1s backoff) before showing the error.
    const retry = await screen.findByRole('button', { name: 'Повторить' }, { timeout: 4000 });
    expect(screen.getByText(/Сервер временно недоступен/)).toBeInTheDocument();

    mockSettings.set({ serverDown: false });
    await user.click(retry);
    expect(await within(list()).findByText('Дейли')).toBeInTheDocument();
  });

  it('keeps the input when saving fails with 500', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.selectOptions(screen.getByLabelText('Начало'), '14:00');
    await user.selectOptions(screen.getByLabelText('Окончание'), '15:00');
    await user.type(screen.getByLabelText(/Название/), 'Синк');
    mockSettings.set({ serverDown: true });
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    const form = screen.getByRole('region', { name: 'Новая бронь' });
    expect(await within(form).findByRole('alert')).toHaveTextContent('Сервер временно недоступен');
    // The background refetch fails too, but the previously loaded schedule stays on screen.
    expect(within(list()).getByText('Дейли')).toBeInTheDocument();
    expect(screen.getByLabelText('Начало')).toHaveValue('14:00');
    expect(screen.getByLabelText(/Название/)).toHaveValue('Синк');
  });

  it('creates a booking', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.selectOptions(screen.getByLabelText('Начало'), '11:00');
    await user.selectOptions(screen.getByLabelText('Окончание'), '12:00');
    await user.type(screen.getByLabelText(/Название/), 'Синк');
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByText('Бронь 11:00–12:00 создана')).toBeInTheDocument();
    expect(await within(list()).findByText('Синк')).toBeInTheDocument();
    expect(store.all()).toHaveLength(2);
  });

  it('blocks submission when client validation fails', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.selectOptions(screen.getByLabelText('Начало'), '10:30');
    await user.selectOptions(screen.getByLabelText('Окончание'), '11:30');
    expect(screen.getByText(/Пересекается с бронью 10:00–11:00 «Дейли»/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Начало'), '12:00');
    await user.selectOptions(screen.getByLabelText('Окончание'), '14:30');
    expect(screen.getByText('Максимальная длительность — 2 ч')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));
    expect(store.all()).toHaveLength(1);
  });

  it('handles a server 409: explains, refreshes the list and keeps the input', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.selectOptions(screen.getByLabelText('Начало'), '14:00');
    await user.selectOptions(screen.getByLabelText('Окончание'), '15:00');
    await user.type(screen.getByLabelText(/Название/), 'Важная встреча');

    // Someone else books the time after our list was loaded.
    store.insert({ id: 'other', date: TODAY, start: '14:30', end: '15:30', title: 'Чужая бронь' });

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('это время заняли: 14:30–15:30 «Чужая бронь»');
    expect(alert).toHaveFocus();

    // The list is refetched and now contains the conflicting booking.
    expect(await within(list()).findByText('Чужая бронь')).toBeInTheDocument();

    // The user's input is intact.
    expect(screen.getByLabelText('Начало')).toHaveValue('14:00');
    expect(screen.getByLabelText('Окончание')).toHaveValue('15:00');
    expect(screen.getByLabelText(/Название/)).toHaveValue('Важная встреча');
  });

  it('keeps the suggested time after a 409 even if the user did not touch the form', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');
    // The form is prefilled with the first free range.
    expect(screen.getByLabelText('Начало')).toHaveValue('09:00');
    expect(screen.getByLabelText('Окончание')).toHaveValue('10:00');

    store.insert({ id: 'other', date: TODAY, start: '09:00', end: '09:30', title: 'Чужая бронь' });
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await within(list()).findByText('Чужая бронь')).toBeInTheDocument();
    // The form must not silently jump to another suggested slot.
    expect(screen.getByLabelText('Начало')).toHaveValue('09:00');
    expect(screen.getByLabelText('Окончание')).toHaveValue('10:00');
    expect(screen.getByRole('alert')).toHaveTextContent('это время заняли');
  });

  it('edits a booking without conflicting with itself', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.click(screen.getByRole('button', { name: 'Изменить бронь 10:00–11:00, Дейли' }));
    expect(screen.getByRole('heading', { name: 'Редактирование брони' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Окончание'), '11:30');
    await user.click(screen.getByRole('button', { name: 'Сохранить изменения' }));

    expect(await screen.findByText('Бронь 10:00–11:30 обновлена')).toBeInTheDocument();
    expect(store.get('a')).toMatchObject({ start: '10:00', end: '11:30', title: 'Дейли' });
  });

  it('deletes a booking after confirmation', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.click(screen.getByRole('button', { name: 'Удалить бронь 10:00–11:00, Дейли' }));
    const dialog = screen.getByRole('dialog', { name: 'Удалить бронь?' });
    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }));

    expect(await screen.findByText('Броней нет — комната свободна весь день.')).toBeInTheDocument();
    expect(store.all()).toEqual([]);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Брони на день/ })).toHaveFocus(),
    );
  });

  it('makes past time unavailable today', async () => {
    vi.setSystemTime(new Date(2030, 2, 4, 12, 10));
    renderApp();
    await within(list()).findByText('Дейли');

    // Timeline: slots that have passed are not offered.
    expect(screen.queryByRole('button', { name: 'Выбрать время с 11:30' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выбрать время с 12:30' })).toBeInTheDocument();
    // Selects: past start times are disabled, the suggestion starts in the future.
    const startSelect = screen.getByLabelText('Начало');
    expect(within(startSelect).getByRole('option', { name: '12:00' })).toBeDisabled();
    expect(within(startSelect).getByRole('option', { name: '12:15' })).toBeEnabled();
    expect(screen.getByLabelText('Начало')).toHaveValue('12:15');
    // A booking that already ended cannot be changed.
    expect(within(list()).getByText('Прошла')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Изменить бронь/ })).not.toBeInTheDocument();
  });

  it('prefills the form from a free timeline slot', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.click(screen.getByRole('button', { name: 'Выбрать время с 14:00' }));
    expect(screen.getByLabelText('Начало')).toHaveValue('14:00');
    expect(screen.getByLabelText('Окончание')).toHaveValue('15:00');

    // Shortened up to the next booking.
    await user.click(screen.getByRole('button', { name: 'Выбрать время с 09:30' }));
    expect(screen.getByLabelText('Начало')).toHaveValue('09:30');
    expect(screen.getByLabelText('Окончание')).toHaveValue('10:00');
  });

  it('leaves edit mode when the date changes', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.click(screen.getByRole('button', { name: 'Изменить бронь 10:00–11:00, Дейли' }));
    expect(screen.getByRole('heading', { name: 'Редактирование брони' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Следующий день' }));
    expect(await screen.findByRole('heading', { name: 'Новая бронь' })).toBeInTheDocument();
    expect(window.location.search).toBe('?date=2030-03-05');
  });

  it('keeps the input when the edited booking was deleted by someone else', async () => {
    const user = renderApp();
    await within(list()).findByText('Дейли');

    await user.click(screen.getByRole('button', { name: 'Изменить бронь 10:00–11:00, Дейли' }));
    await user.selectOptions(screen.getByLabelText('Окончание'), '11:30');
    store.delete('a');
    await user.click(screen.getByRole('button', { name: 'Сохранить изменения' }));

    const form = await screen.findByRole('region', { name: 'Новая бронь' });
    expect(within(form).getByRole('alert')).toHaveTextContent('Эту бронь уже удалили');
    expect(screen.getByLabelText('Начало')).toHaveValue('10:00');
    expect(screen.getByLabelText('Окончание')).toHaveValue('11:30');
    expect(screen.getByLabelText(/Название/)).toHaveValue('Дейли');
  });

  it('does not allow creating bookings on past dates', async () => {
    window.history.replaceState(null, '', '/?date=2030-03-01');
    store.replaceAll([]);
    renderApp();
    expect(await screen.findByText(/Нельзя бронировать на прошедшую дату/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Забронировать' })).not.toBeInTheDocument();
  });
});
