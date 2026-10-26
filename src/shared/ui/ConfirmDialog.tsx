import { useEffect, useId, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pendingLabel,
  isPending,
  error,
  onConfirm,
  onClose,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      onCancel={(e) => {
        e.preventDefault();
        if (!isPending) onClose();
      }}
    >
      {open && (
        <>
          <h2 id={`${id}-title`} className="dialog__title">
            {title}
          </h2>
          <div id={`${id}-desc`} className="dialog__body">
            {children}
          </div>
          {error && (
            <div role="alert" className="alert alert--error">
              {error}
            </div>
          )}
          <div className="dialog__actions">
            <button type="button" className="btn" onClick={onClose} disabled={isPending}>
              Отмена
            </button>
            <button
              type="button"
              className="btn btn--danger-solid"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
