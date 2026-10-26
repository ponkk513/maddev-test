import type { ZodType } from 'zod';
import { ApiError, apiErrorBodySchema } from './errors';

export type RequestOptions<T> = RequestInit & {
  /** Runtime validation of the response: the client never trusts the shape blindly. */
  schema?: ZodType<T>;
};

export type HttpClient = <T>(path: string, options?: RequestOptions<T>) => Promise<T>;

/**
 * A thin wrapper over fetch: builds the URL, sends JSON
 * and converts any non-2xx or malformed response into an ApiError.
 */
export function createHttpClient(baseUrl: string): HttpClient {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

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

    const data: unknown =
      response.status === 204 ? undefined : await response.json().catch(() => null);

    if (!response.ok) {
      const body = apiErrorBodySchema.safeParse(data);
      if (body.success) {
        throw new ApiError(response.status, body.data.code, body.data.message, body.data);
      }
      throw new ApiError(
        response.status,
        'UNKNOWN',
        `Request failed with status ${response.status}`,
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
