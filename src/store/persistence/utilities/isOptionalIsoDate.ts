import { isIsoDate } from '../../common/utilities/isIsoDate';

/**
 * Checks whether an untrusted value is `null` or a real `YYYY-MM-DD` date.
 *
 * @param value - The value to check.
 * @returns `true` for `null` and for a string that `isIsoDate` accepts.
 * @example
 * isOptionalIsoDate(null);         // true
 * isOptionalIsoDate('2024-02-30'); // false
 */
export function isOptionalIsoDate(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && isIsoDate(value));
}
