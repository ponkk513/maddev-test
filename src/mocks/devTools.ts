/**
 * Mock server switches for demonstrating edge cases.
 * Live in the same JS context as MSW handlers, so the UI can toggle them directly.
 */
export type MockSettings = {
  /** Before the next POST/PATCH, "another user" takes the requested time → 409. */
  simulateConflictOnNextWrite: boolean;
  /** While on, every request ends with 500 (also defeats the client's automatic retry). */
  serverDown: boolean;
  /** Artificial latency, ms. */
  latencyMs: number;
};

type Listener = () => void;

let settings: MockSettings = {
  simulateConflictOnNextWrite: false,
  serverDown: false,
  latencyMs: 600,
};
const listeners = new Set<Listener>();

export const mockSettings = {
  get: (): MockSettings => settings,
  set(patch: Partial<MockSettings>): void {
    settings = { ...settings, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Reads a one-shot flag and resets it. */
  consume(flag: 'simulateConflictOnNextWrite'): boolean {
    const value = settings[flag];
    if (value) mockSettings.set({ [flag]: false });
    return value;
  },
};
