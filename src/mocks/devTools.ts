export type MockSettings = {
  simulateConflictOnNextWrite: boolean;
  serverDown: boolean;
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
  takeConflictSimulation(): boolean {
    const { simulateConflictOnNextWrite } = settings;
    if (simulateConflictOnNextWrite) mockSettings.set({ simulateConflictOnNextWrite: false });
    return simulateConflictOnNextWrite;
  },
};
