/**
 * Mock API is on by default (including the production demo build).
 * To work with a real backend: VITE_USE_MOCKS=false VITE_API_URL=https://api.example.com
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

/** Base URL of the API. Empty = same origin (where MSW intercepts requests). */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
