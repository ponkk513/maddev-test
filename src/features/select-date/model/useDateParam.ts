import { useCallback, useEffect, useRef, useState } from 'react';
import { isValidDate } from '@/shared/lib';

const PARAM = 'date';

function readParam(fallback: string): string {
  const value = new URLSearchParams(window.location.search).get(PARAM);
  return isValidDate(value) ? value : fallback;
}

/**
 * Selected date synced with ?date=YYYY-MM-DD: a link opens the same day; back/forward works.
 * `onChange` fires on every change of the date — by the user or by browser history —
 * so dependants react to an event instead of syncing state in an effect.
 */
export function useDateParam(fallback: string, onChange?: (date: string) => void) {
  const [date, setDateState] = useState(() => readParam(fallback));

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const onPop = () => {
      const next = readParam(fallback);
      setDateState(next);
      onChangeRef.current?.(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [fallback]);

  const setDate = useCallback((next: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(PARAM, next);
    window.history.pushState(null, '', url);
    setDateState(next);
    onChangeRef.current?.(next);
  }, []);

  return [date, setDate] as const;
}
