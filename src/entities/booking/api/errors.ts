import { z } from 'zod';
import { isApiError, type ApiError } from '@/shared/api';
import type { ValidationIssue } from '../model/rules';
import { bookingSchema } from '../model/schema';
import type { Booking } from '../model/types';

export type BookingErrorBody =
  | { code: 'CONFLICT'; message: string; conflicts: Booking[] }
  | { code: 'VALIDATION'; message: string; issues: ValidationIssue[] }
  | { code: 'BOOKING_LOCKED'; message: string }
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'BAD_REQUEST'; message: string }
  | { code: 'INTERNAL'; message: string };

export type BookingErrorCode = BookingErrorBody['code'];

const conflictBodySchema = z.object({ conflicts: z.array(bookingSchema) });
const validationBodySchema = z.object({
  issues: z.array(z.object({ field: z.string(), code: z.string(), message: z.string() })),
});

// Detected by HTTP status: the contract guarantees the status, the body is optional details.
export function isConflictError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 409;
}

export function isNotFoundError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 404;
}

export function getConflicts(error: unknown): Booking[] {
  if (!isConflictError(error)) return [];
  const parsed = conflictBodySchema.safeParse(error.body);
  return parsed.success ? parsed.data.conflicts : [];
}

export function getValidationIssues(error: unknown): ValidationIssue[] {
  if (!isApiError(error) || error.status !== 422) return [];
  const parsed = validationBodySchema.safeParse(error.body);
  return parsed.success ? (parsed.data.issues as ValidationIssue[]) : [];
}
