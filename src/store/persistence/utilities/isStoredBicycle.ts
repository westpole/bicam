import type { Bicycle } from '../../bicycle/types';
import { isIsoDate } from '../../common/utilities/isIsoDate';
import { isRecord } from './isRecord';

/**
 * Checks whether an untrusted value has the shape of a {@link Bicycle}. Checks types and the date format only, not the
 * field limits, so tightening a limit never makes saved data unreadable.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a bicycle.
 * @example
 * isStoredBicycle({ id: 'bike-1' }); // false: the other fields are missing
 */
export function isStoredBicycle(value: unknown): value is Bicycle {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.company === 'string' &&
    typeof value.model === 'string' &&
    (value.purchased === null || (typeof value.purchased === 'string' && isIsoDate(value.purchased))) &&
    (value.size === null || typeof value.size === 'string') &&
    (value.frameGeometry === null || typeof value.frameGeometry === 'string') &&
    Array.isArray(value.components) &&
    value.components.every((id) => typeof id === 'string')
  );
}
