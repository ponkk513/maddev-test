import { formatBookings, getConflicts, isConflictError, isNotFoundError } from '@/entities/booking';
import { getErrorMessage } from '@/shared/api';

export type ServerErrorKind = 'conflict' | 'gone' | 'other';

export type ServerError = { kind: ServerErrorKind; message: string };

export function toServerError(error: unknown, isEdit: boolean): ServerError {
  if (isConflictError(error)) {
    const conflicts = getConflicts(error);
    const details = conflicts.length ? `: ${formatBookings(conflicts)}` : '';
    return {
      kind: 'conflict',
      message: `Пока вы заполняли форму, это время заняли${details}. Расписание обновлено — выберите другое время, введённые данные сохранены.`,
    };
  }
  if (isNotFoundError(error) && isEdit) {
    return {
      kind: 'gone',
      message:
        'Эту бронь уже удалили. Расписание обновлено; можно создать новую бронь с теми же параметрами.',
    };
  }
  return { kind: 'other', message: getErrorMessage(error) };
}
