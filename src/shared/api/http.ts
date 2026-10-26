import type { ZodType, ZodTypeDef } from 'zod';
import { ApiError, apiErrorBodySchema } from './errors';

export type RequestOptions<T> = RequestInit & {
  schema?: ZodType<T, ZodTypeDef, unknown>;
};

export type HttpClient = <T>(path: string, options?: RequestOptions<T>) => Promise<T>;

export function createHttpClient(baseUrl: string): HttpClient {
  const base = new URL(
    baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
    globalThis.location?.href ?? 'http://localhost/',
  );

  return async function request<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
    const { schema, ...init } = options;
    const url = new URL(path.replace(/^\//, ''), base);

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...init.headers,
        },
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
      throw new ApiError(0, 'NETWORK', 'Network error');
    }

    const data = await readJson(response);

    if (!response.ok) {
      const body = apiErrorBodySchema.safeParse(data);
      if (body.success) {
        throw new ApiError(response.status, body.data.code, body.data.message, body.data);
      }
      throw new ApiError(
        response.status,
        'UNKNOWN',
        `Не удалось выполнить запрос (HTTP ${response.status}).`,
      );
    }

    if (!schema) return data as T;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError(response.status, 'INVALID_RESPONSE', parsed.error.message);
    }
    return parsed.data;
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
