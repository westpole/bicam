import type { Bicycle } from '../../bicycle/types';
import { isOptionalIsoDate } from './isOptionalIsoDate';
import { isRecord } from './isRecord';
import { isStoredBicycleV1 } from './isStoredBicycleV1';

/**
 * Checks whether an untrusted value has the shape of a {@link Bicycle}: the version 1 fields plus the odometer. Checks
 * types and date formats only, not the field limits, so tightening a limit never makes saved data unreadable.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a bicycle.
 * @example
 * isStoredBicycle({ id: 'bike-1' }); // false: the other fields are missing
 */
export function isStoredBicycle(value: unknown): value is Bicycle {
  return (
    isRecord(value) &&
    typeof value.odometer === 'number' &&
    isOptionalIsoDate(value.odometerDate) &&
    isStoredBicycleV1(value)
  );
}
