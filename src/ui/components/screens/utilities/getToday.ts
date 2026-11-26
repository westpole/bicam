import type { IsoDate } from '@store/common/types';

/**
 * Returns today's date in the user's time zone. The store has no clock, so the UI supplies dates such as the default
 * date of a new odometer reading.
 *
 * @param now - The moment to read; defaults to the current time.
 * @returns The local date as `YYYY-MM-DD`.
 * @example
 * getToday(new Date(2026, 3, 12, 23, 30)); // '2026-04-12'
 */
export function getToday(now: Date = new Date()): IsoDate {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}
