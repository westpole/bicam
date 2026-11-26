import type { ComponentUsagePeriod } from '../types';
import { getLatestBoundary } from '../utilities/getLatestBoundary';

/**
 * Builds a usage period.
 *
 * @param bicycleId - The bicycle it names.
 * @param start - The start reading.
 * @param end - The end reading, or `null` while in use.
 * @returns The period.
 */
function period(bicycleId: string, start: number, end: number | null): ComponentUsagePeriod {
  return {
    id: `period-${bicycleId}-${start}`,
    bicycleId,
    start: { date: null, odometer: start },
    end: end === null ? null : { date: null, odometer: end },
    replacedPeriodId: null,
  };
}

describe('getLatestBoundary', () => {
  it('is 0 without periods on the bicycle', () => {
    expect(getLatestBoundary([], 'bike-1')).toBe(0);
    expect(getLatestBoundary([period('bike-2', 100, 900)], 'bike-1')).toBe(0);
  });

  it('takes the latest start or end on the bicycle', () => {
    expect(getLatestBoundary([period('bike-1', 0, 1500), period('bike-2', 0, 9000)], 'bike-1')).toBe(1500);
    expect(getLatestBoundary([period('bike-1', 0, 1500), period('bike-1', 3100, null)], 'bike-1')).toBe(3100);
  });
});
