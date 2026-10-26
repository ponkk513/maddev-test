import { formatBookings, getConflicts, hasErrorCode } from '@/entities/booking';
import { getErrorMessage } from '@/shared/api';

export type ServerErrorKind = 'conflict' | 'gone' | 'other';

export type ServerError = { kind: ServerErrorKind; message: string };

/** Turns a failed save into a message that tells the user what happened and what to do. */
export function toServerError(error: unknown, isEdit: boolean): ServerError {
  if (hasErrorCode(error, 'CONFLICT')) {
    const conflicts = getConflicts(error);
    const details = conflicts.length ? `: ${formatBookings(conflicts)}` : '';
    return {
      kind: 'conflict',
      message: `Пока вы заполняли форму, это время заняли${details}. Расписание обновлено — выберите другое время, введённые данные сохранены.`,
    };
  }
  if (hasErrorCode(error, 'NOT_FOUND') && isEdit) {
    return {
      kind: 'gone',
      message:
        'Эту бронь уже удалили. Расписание обновлено; можно создать новую бронь с теми же параметрами.',
    };
  }
  return { kind: 'other', message: getErrorMessage(error) };
}
