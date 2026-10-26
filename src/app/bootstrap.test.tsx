import { act, screen } from '@testing-library/react';
import type { Root } from 'react-dom/client';
import { createTestServer } from '@/test/server';
import { bootstrap } from './bootstrap';

const { server } = createTestServer();

let root: Root | undefined;
let container: HTMLElement;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  container = document.body.appendChild(document.createElement('div'));
});
afterEach(() => {
  act(() => root?.unmount());
  container.remove();
});

describe('bootstrap', () => {
  it('explains the problem instead of a blank page when the mock API cannot start', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      root = await bootstrap(container, () =>
        Promise.reject(new Error('Service workers are not supported')),
      );
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось запустить демо');
    expect(screen.getByText(/обычном окне браузера/)).toBeInTheDocument();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('renders the app with dev tools once the mock API has started', async () => {
    await act(async () => {
      root = await bootstrap(container, async () => <p>dev tools</p>);
    });

    expect(await screen.findByRole('heading', { name: 'Переговорная' })).toBeInTheDocument();
    expect(screen.getByText('dev tools')).toBeInTheDocument();
  });

  it('renders the app without mocks when they are disabled', async () => {
    await act(async () => {
      root = await bootstrap(container);
    });

    expect(await screen.findByRole('heading', { name: 'Переговорная' })).toBeInTheDocument();
  });
});
