import { z } from 'zod';

export const apiErrorBodySchema = z.object({ code: z.string(), message: z.string() }).passthrough();

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: ApiErrorBody | null;

  constructor(status: number, code: string, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === 'NETWORK') return 'Нет соединения с сервером. Проверьте подключение.';
    if (error.code === 'INVALID_RESPONSE') return 'Сервер вернул неожиданный ответ.';
    if (error.status >= 500) return 'Сервер временно недоступен. Попробуйте ещё раз.';
    return error.message;
  }
  return 'Что-то пошло не так. Попробуйте ещё раз.';
}
