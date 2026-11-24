import { isIsoDate } from '../../common/utilities/isIsoDate';
import { COMPONENT_LIMITS } from '../constants';
import type {
  BicycleComponentType,
  ComponentErrorCode,
  ComponentHistoryDetails,
  ComponentHistoryField,
  ComponentHistoryValidationError,
} from '../types';
import { checkNumber } from './checkNumber';

/**
 * Checks a required date: not blank, then a real calendar date.
 *
 * @param date - Already trimmed date.
 * @returns The first failing rule's code, or `null` when the date is valid.
 */
function checkRequiredDate(date: string): ComponentErrorCode | null {
  if (date === '') {
    return 'required';
  }

  return isIsoDate(date) ? null : 'invalidFormat';
}

/**
 * Validates normalized history details against the field limits in `docs/store/components.md` §2.2. Dates are not
 * compared with each other or with today. The generated `id` is not validated.
 *
 * @param _type - Type of the component the entry belongs to. No current field depends on it.
 * @param entry - Output of `normalizeComponentHistoryInput` (trimmed, missing numbers as `null`).
 * @returns Every failing field, at most one error each, in `ComponentHistoryEntry` field order; `[]` when valid.
 * @example
 * validateComponentHistoryEntry('chain', { date: '', installed: '2023-02-30', distance: -1 });
 * // [{ field: 'date', code: 'required' }, { field: 'installed', code: 'invalidFormat' },
 * //  { field: 'distance', code: 'outOfRange' }]
 */
export function validateComponentHistoryEntry(
  _type: BicycleComponentType,
  entry: ComponentHistoryDetails,
): ComponentHistoryValidationError[] {
  const { distanceMax, distanceMaxDecimals } = COMPONENT_LIMITS;
  const checks: Array<[ComponentHistoryField, ComponentErrorCode | null]> = [
    ['date', checkRequiredDate(entry.date)],
    ['installed', checkRequiredDate(entry.installed)],
    ['distance', entry.distance === null ? null : checkNumber(entry.distance, distanceMax, distanceMaxDecimals)],
  ];

  return checks.flatMap(([field, code]) => (code ? [{ field, code }] : []));
}
