import type { BicycleV1 } from '../types';
import { isOptionalIsoDate } from './isOptionalIsoDate';
import { isRecord } from './isRecord';

/**
 * Checks whether an untrusted value has the shape of a version 1 bicycle. Checks types and the date format only, not
 * the field limits, so tightening a limit never makes saved data unreadable. Extra keys are ignored, so a version 2
 * bicycle passes too.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a version 1 bicycle.
 * @example
 * isStoredBicycleV1({ id: 'bike-1' }); // false: the other fields are missing
 */
export function isStoredBicycleV1(value: unknown): value is BicycleV1 {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.company === 'string' &&
    typeof value.model === 'string' &&
    isOptionalIsoDate(value.purchased) &&
    (value.size === null || typeof value.size === 'string') &&
    (value.frameGeometry === null || typeof value.frameGeometry === 'string') &&
    Array.isArray(value.components) &&
    value.components.every((id) => typeof id === 'string')
  );
}
