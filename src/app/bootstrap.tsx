import { StrictMode, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';
import { MocksUnavailable } from './MocksUnavailable';

type StartMocks = () => Promise<ReactNode>;

export async function bootstrap(container: HTMLElement, startMocks?: StartMocks): Promise<Root> {
  const root = createRoot(container);
  let devTools: ReactNode = null;

  if (startMocks) {
    try {
      devTools = await startMocks();
    } catch (error) {
      console.error('Mock API failed to start', error);
      root.render(<MocksUnavailable />);
      return root;
    }
  }

  root.render(
    <StrictMode>
      <App devTools={devTools} />
    </StrictMode>,
  );
  return root;
}
