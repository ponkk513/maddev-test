import { useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mockSettings } from './devTools';
import { mockStore } from './browser';

/** Mock server controls — for demoing edge cases. Not part of the product UI. */
export function DevPanel() {
  const settings = useSyncExternalStore(mockSettings.subscribe, mockSettings.get);
  const queryClient = useQueryClient();

  return (
    <details className="dev-panel">
      <summary>Инструменты демо (mock API)</summary>
      <div className="dev-panel__body">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.simulateConflictOnNextWrite}
            onChange={(e) => mockSettings.set({ simulateConflictOnNextWrite: e.target.checked })}
          />
          Следующее сохранение: кто-то успевает занять это время (409)
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.serverDown}
            onChange={(e) => mockSettings.set({ serverDown: e.target.checked })}
          />
          Сервер недоступен: все запросы отвечают 500
        </label>
        <label className="dev-panel__latency">
          Задержка сети: {settings.latencyMs} мс
          <input
            type="range"
            min={0}
            max={3000}
            step={100}
            value={settings.latencyMs}
            onChange={(e) => mockSettings.set({ latencyMs: Number(e.target.value) })}
          />
        </label>
        <button
          type="button"
          className="btn btn--small"
          onClick={() => {
            mockStore.reset();
            void queryClient.invalidateQueries();
          }}
        >
          Сбросить демо-данные
        </button>
        <p className="muted dev-panel__hint">
          Данные хранятся в localStorage и общие для вкладок: откройте приложение в двух вкладках,
          чтобы воспроизвести конфликт «по-честному».
        </p>
      </div>
    </details>
  );
}
