export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
