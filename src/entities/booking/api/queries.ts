import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from './bookingsApi';
import type { Booking, BookingDraft, BookingPatch } from '../model/types';

export const bookingKeys = {
  all: ['bookings'] as const,
  byDate: (date: string) => ['bookings', date] as const,
};

export function useBookings(date: string) {
  return useQuery({
    queryKey: bookingKeys.byDate(date),
    queryFn: ({ signal }) => bookingsApi.list(date, { signal }),
  });
}

// Used in onSettled, not onSuccess: after a 409 or 404 the cached list is stale too.
function useInvalidateDate() {
  const queryClient = useQueryClient();
  return (date: string) => queryClient.invalidateQueries({ queryKey: bookingKeys.byDate(date) });
}

export function useCreateBooking() {
  const invalidate = useInvalidateDate();
  return useMutation({
    mutationFn: (draft: BookingDraft) => bookingsApi.create(draft),
    onSettled: (_data, _error, draft) => invalidate(draft.date),
  });
}

export function useUpdateBooking() {
  const invalidate = useInvalidateDate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; date: string; patch: BookingPatch }) =>
      bookingsApi.update(id, patch),
    onSettled: (_data, _error, { date }) => invalidate(date),
  });
}

export function useDeleteBooking() {
  const invalidate = useInvalidateDate();
  return useMutation({
    mutationFn: (booking: Booking) => bookingsApi.remove(booking.id),
    onSettled: (_data, _error, booking) => invalidate(booking.date),
  });
}
