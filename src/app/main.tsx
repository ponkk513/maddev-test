import { USE_MOCKS } from '@/shared/config';
import { bootstrap } from './bootstrap';
import './styles/index.css';

async function startMocks() {
  // Dynamic imports keep MSW out of the bundle when mocks are off.
  const [{ worker }, { DevPanel }] = await Promise.all([
    import('@/mocks/browser'),
    import('@/mocks/DevPanel'),
  ]);
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
  return <DevPanel />;
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

void bootstrap(container, USE_MOCKS ? startMocks : undefined);
