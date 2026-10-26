import { useState } from 'react';
import { formatBooking, isNotFoundError, useDeleteBooking, type Booking } from '@/entities/booking';
import { getErrorMessage } from '@/shared/api';

type Options = {
  onDeleted: (booking: Booking, message: string) => void;
};

export function useDeleteBookingFlow({ onDeleted }: Options) {
  const [target, setTarget] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useDeleteBooking();

  function finish(booking: Booking, message: string) {
    setTarget(null);
    onDeleted(booking, message);
  }

  async function confirm() {
    if (!target) return;
    setError(null);
    try {
      await mutation.mutateAsync(target);
      finish(target, `Бронь ${formatBooking({ ...target, title: undefined })} удалена`);
    } catch (e) {
      if (isNotFoundError(e)) finish(target, 'Эта бронь уже была удалена');
      else setError(getErrorMessage(e));
    }
  }

  return {
    target,
    error,
    isDeleting: mutation.isPending,
    request: (booking: Booking) => {
      setError(null);
      setTarget(booking);
    },
    close: () => setTarget(null),
    confirm,
  };
}

export type DeleteBookingFlow = ReturnType<typeof useDeleteBookingFlow>;
