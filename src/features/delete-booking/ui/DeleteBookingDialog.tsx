import { formatBooking } from '@/entities/booking';
import { ConfirmDialog } from '@/shared/ui';
import type { DeleteBookingFlow } from '../model/useDeleteBooking';

export function DeleteBookingDialog({ flow }: { flow: DeleteBookingFlow }) {
  return (
    <ConfirmDialog
      open={flow.target !== null}
      title="Удалить бронь?"
      confirmLabel="Удалить"
      pendingLabel="Удаление…"
      isPending={flow.isDeleting}
      error={flow.error}
      onConfirm={flow.confirm}
      onClose={flow.close}
    >
      {flow.target && <p>{formatBooking(flow.target)}. Действие нельзя отменить.</p>}
    </ConfirmDialog>
  );
}
