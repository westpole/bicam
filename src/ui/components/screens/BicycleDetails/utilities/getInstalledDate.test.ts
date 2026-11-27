import type { ComponentUsagePeriod } from '@store/components/types';
import { CHAIN_RESTING_ROW } from '@ui/components/ComponentList/__mocks__/rows';

import { getInstalledDate } from './getInstalledDate';

/**
 * Builds a usage period.
 *
 * @param date - Its start date, or `null` when unknown.
 * @param start - Its start reading.
 * @returns The period, closed 100 km later.
 */
function period(date: string | null, start: number): ComponentUsagePeriod {
  return {
    id: `period-${start}`,
    bicycleId: 'bike-1',
    start: { date, odometer: start },
    end: { date: null, odometer: start + 100 },
    replacedPeriodId: null,
  };
}

describe('getInstalledDate', () => {
  const chain = CHAIN_RESTING_ROW.component;

  it('is the first usage start date', () => {
    const usage = [period('2026-03-01', 0), period('2026-04-01', 500)];

    expect(getInstalledDate({ ...chain, usage }, '2026-04-12')).toBe('2026-03-01');
  });

  it("is the entry's date when the first start date is unknown", () => {
    expect(getInstalledDate({ ...chain, usage: [period(null, 0), period('2026-04-01', 500)] }, '2026-04-12')).toBe(
      '2026-04-12',
    );
  });

  it("is the entry's date for a component that was never used", () => {
    expect(getInstalledDate(chain, '2026-04-12')).toBe('2026-04-12');
  });
});
