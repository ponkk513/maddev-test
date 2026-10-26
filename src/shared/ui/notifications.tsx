import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const AUTO_HIDE_MS = 5000;

type Notify = (message: string) => void;

const NotifyContext = createContext<Notify | null>(null);

/**
 * Results of user actions ("Booking created"). A single polite live region
 * that is always mounted, so screen readers announce every message.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const notify = useCallback<Notify>((next) => setMessage(next), []);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(''), AUTO_HIDE_MS);
    return () => clearTimeout(id);
  }, [message]);

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {message && (
          <div className="toast">
            <span>{message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => setMessage('')}
              aria-label="Скрыть уведомление"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </NotifyContext.Provider>
  );
}

export function useNotify(): Notify {
  const notify = useContext(NotifyContext);
  if (!notify) throw new Error('useNotify must be used within NotificationsProvider');
  return notify;
}
