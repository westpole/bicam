import type { UsageInterval } from '../types';

/**
 * Checks the capacity part of rule 4 (`docs/store/components.md` §2.3): at no reading from `from` on are more of the
 * intervals open than `limit` allows. Intervals are half-open, so one ending at 1500 and one starting at 1500 do not
 * overlap, and a zero-length interval is never open.
 *
 * Pass every period of one type on one bicycle, as it would be after the change: the new period included, and a
 * replaced period ended at the new start.
 *
 * @param intervals - The periods' readings.
 * @param from - The first reading to check: the new start. Earlier readings are not checked, because an old overlap
 * cannot be fixed by this start.
 * @param limit - How many may be open at once (`ACTIVE_LIMITS`), or `null` for no limit.
 * @returns `true` when every reading from `from` on stays within the limit.
 * @example
 * fitsActiveLimit([{ start: 0, end: 1500 }, { start: 1500, end: null }], 1500, 1); // true
 * fitsActiveLimit([{ start: 0, end: 1500 }, { start: 1000, end: null }], 1000, 1); // false
 */
export function fitsActiveLimit(intervals: readonly UsageInterval[], from: number, limit: number | null): boolean {
  if (limit === null) {
    return true;
  }

  // The count only rises at a start, so checking `from` and every later start covers every reading. Quadratic in the
  // number of periods, which is fine: one type on one bicycle has few, and a component at most 500.
  const readings = [from, ...intervals.map(({ start }) => start).filter((start) => start > from)];

  return readings.every(
    (reading) =>
      intervals.filter(({ start, end }) => start <= reading && (end === null || reading < end)).length <= limit,
  );
}
