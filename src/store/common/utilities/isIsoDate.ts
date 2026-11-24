import { ISO_DATE_PATTERN } from '../constants';

/**
 * Checks that a string is a real calendar date in `YYYY-MM-DD` form (no time, no time zone).
 *
 * @param value - The string to check.
 * @returns `true` when `value` has the right shape and names a day that exists (leap years included).
 * @example
 * isIsoDate('2024-02-29'); // true
 * isIsoDate('2023-02-29'); // false
 * isIsoDate('2024-5-7');   // false
 */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(0);
  // setUTCFullYear, unlike Date.UTC, does not map years 0–99 to 1900–1999.
  date.setUTCFullYear(year, month - 1, day);

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
