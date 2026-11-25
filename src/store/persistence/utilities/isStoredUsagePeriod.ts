import type { ComponentUsagePeriod, OdometerReading } from '../../components/types';
import { isOptionalIsoDate } from './isOptionalIsoDate';
import { isRecord } from './isRecord';

/**
 * Checks whether an untrusted value has the shape of an {@link OdometerReading}.
 *
 * @param value - The value to check.
 * @returns `true` when `date` is `null` or a real date and `odometer` is a number.
 */
function isOdometerReading(value: unknown): value is OdometerReading {
  return isRecord(value) && isOptionalIsoDate(value.date) && typeof value.odometer === 'number';
}

/**
 * Checks whether an untrusted value has the shape of a {@link ComponentUsagePeriod}. Checks types and date formats
 * only. Neither `bicycleId` nor `replacedPeriodId` is looked up here, because both may name something that was removed;
 * `isPersistedAppState` checks the bicycle of an open period.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a usage period.
 * @example
 * isStoredUsagePeriod({
 *   id: 'period-1', bicycleId: 'bike-1', start: { date: null, odometer: 0 }, end: null, replacedPeriodId: null,
 * }); // true
 */
export function isStoredUsagePeriod(value: unknown): value is ComponentUsagePeriod {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.bicycleId === 'string' &&
    isOdometerReading(value.start) &&
    (value.end === null || isOdometerReading(value.end)) &&
    (value.replacedPeriodId === null || typeof value.replacedPeriodId === 'string')
  );
}
