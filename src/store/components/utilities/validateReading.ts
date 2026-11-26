import { BICYCLE_LIMITS } from '../../bicycle/constants';
import type { IsoDate } from '../../common/types';
import { checkNumber } from '../../common/utilities/checkNumber';
import { isIsoDate } from '../../common/utilities/isIsoDate';
import { toOptionalText } from '../../common/utilities/toOptionalText';
import type { ComponentErrorCode, ComponentReadingInput, OdometerReading } from '../types';

/** Result of {@link validateReading}: the normalized reading, and the format error of each field, if any. */
export interface ReadingValidation {
  /** The reading with a trimmed date (blank becomes `null`) and `-0` as `0`. Use it only when both codes are `null`. */
  reading: OdometerReading;
  /** Why the odometer failed the number rules, or `null`. */
  odometer: ComponentErrorCode | null;
  /** Why the date failed, or `null`. */
  date: ComponentErrorCode | null;
}

/**
 * Normalizes an odometer reading for the usage actions and checks its format: a number from 0 to
 * `BICYCLE_LIMITS.odometerMax` with at most one decimal, and an optional real date. Rule-specific ranges (rules 4 and
 * 5) are checked by the caller.
 *
 * @param input - The reading as the form provides it.
 * @returns The normalized reading and the code of each failing field.
 * @example
 * validateReading({ date: ' 2026-04-12 ', odometer: 1500 });
 * // { reading: { date: '2026-04-12', odometer: 1500 }, odometer: null, date: null }
 */
export function validateReading(input: ComponentReadingInput): ReadingValidation {
  // `-0 === 0`, so this also turns -0, which does not survive a JSON round trip, into 0.
  const odometer = input.odometer === 0 ? 0 : input.odometer;
  const date: IsoDate | null = toOptionalText(input.date);

  return {
    reading: { date, odometer },
    odometer: checkNumber(odometer, BICYCLE_LIMITS.odometerMax, BICYCLE_LIMITS.odometerMaxDecimals),
    date: date === null || isIsoDate(date) ? null : 'invalidFormat',
  };
}
