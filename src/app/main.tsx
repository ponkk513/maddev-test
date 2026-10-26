import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { USE_MOCKS } from '@/shared/config';
import { App } from './App';
import './styles/index.css';

async function bootstrap() {
  let devTools: ReactNode = null;

  if (USE_MOCKS) {
    const [{ worker }, { DevPanel }] = await Promise.all([
      import('@/mocks/browser'),
      import('@/mocks/DevPanel'),
    ]);
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: import.meta.env.PROD,
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    });
    devTools = <DevPanel />;
  }

  const root = document.getElementById('root');
  if (!root) throw new Error('Root element #root not found');

  createRoot(root).render(
    <StrictMode>
      <App devTools={devTools} />
    </StrictMode>,
  );
}

void bootstrap();
