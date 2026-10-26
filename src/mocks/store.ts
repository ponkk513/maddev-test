import type { Booking } from '@/entities/booking';
import { addDays, toISODate } from '@/shared/lib';

const STORAGE_KEY = 'mock-db:bookings:v1';

// Re-reads localStorage on every call, so two tabs act as two users of one server.
export class BookingStore {
  private memory: Booking[] | null = null;

  constructor(
    private readonly storage: Storage | null = getStorage(),
    initial?: Booking[],
  ) {
    if (initial) this.write(initial);
    else if (!this.read()) this.write(createSeed(new Date()));
  }

  all(): Booking[] {
    return this.read() ?? [];
  }

  byDate(date: string): Booking[] {
    return this.all().filter((b) => b.date === date);
  }

  get(id: string): Booking | undefined {
    return this.all().find((b) => b.id === id);
  }

  insert(booking: Booking): void {
    this.write([...this.all(), booking]);
  }

  replace(booking: Booking): void {
    this.write(this.all().map((b) => (b.id === booking.id ? booking : b)));
  }

  delete(id: string): void {
    this.write(this.all().filter((b) => b.id !== id));
  }

  replaceAll(bookings: Booking[]): void {
    this.write(bookings);
  }

  reset(now = new Date()): void {
    this.write(createSeed(now));
  }

  private read(): Booking[] | null {
    if (!this.storage) return this.memory;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Booking[]) : null;
    } catch {
      return null;
    }
  }

  private write(bookings: Booking[]): void {
    this.memory = bookings;
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      // Storage unavailable (private mode, quota): keep working in memory.
    }
  }
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSeed(now: Date): Booking[] {
  const today = toISODate(now);
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  return [
    { id: createId(), date: yesterday, start: '11:00', end: '12:00', title: 'Ретроспектива' },
    { id: createId(), date: today, start: '09:30', end: '10:00', title: 'Дейли' },
    { id: createId(), date: today, start: '13:00', end: '14:30', title: 'Созвон с клиентом' },
    { id: createId(), date: today, start: '16:00', end: '17:00' },
    { id: createId(), date: tomorrow, start: '10:00', end: '11:00', title: 'Собеседование' },
    { id: createId(), date: tomorrow, start: '11:00', end: '12:00', title: 'Планирование спринта' },
  ];
}
