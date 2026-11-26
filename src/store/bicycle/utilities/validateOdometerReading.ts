import { checkNumber } from '../../common/utilities/checkNumber';
import { isIsoDate } from '../../common/utilities/isIsoDate';
import { BICYCLE_LIMITS } from '../constants';
import type { BicycleErrorCode, BicycleField, BicycleValidationError } from '../types';

/**
 * Validates a normalized odometer reading (`docs/store/bicycle.md` §4): a number from `minimum` to
 * `BICYCLE_LIMITS.odometerMax` with at most one decimal, and an optional real date.
 *
 * @param odometer - The reading in kilometres.
 * @param date - The trimmed date, or `null` when unknown.
 * @param minimum - The lowest allowed reading, from `getMinimumOdometer` (rule 6).
 * @returns Every failing field, at most one error each, `odometer` before `odometerDate`; `[]` when valid.
 * @example
 * validateOdometerReading(1200, '2026-04-12', 1500); // [{ field: 'odometer', code: 'outOfRange' }]
 */
export function validateOdometerReading(
  odometer: number,
  date: string | null,
  minimum: number,
): BicycleValidationError[] {
  const numberCode = checkNumber(odometer, BICYCLE_LIMITS.odometerMax, BICYCLE_LIMITS.odometerMaxDecimals);
  const checks: Array<[BicycleField, BicycleErrorCode | null]> = [
    ['odometer', numberCode ?? (odometer < minimum ? 'outOfRange' : null)],
    ['odometerDate', date === null || isIsoDate(date) ? null : 'invalidFormat'],
  ];

  return checks.flatMap(([field, code]) => (code ? [{ field, code }] : []));
}
