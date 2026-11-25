import type { IsoDate } from '@store/common/types';

/**
 * Formats a stored calendar date for display. Formats in UTC, so the day never shifts with the user's time zone.
 *
 * @param date - A valid `YYYY-MM-DD` date.
 * @param language - BCP 47 language tag.
 * @returns The localized date.
 * @example
 * formatDate('2024-05-17', 'en'); // 'May 17, 2024'
 */
export function formatDate(date: IsoDate, language: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(date));
}
