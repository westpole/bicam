import { storedComponent } from '../__mocks__/storedComponent';
import type { BicycleComponent, ComponentCollection, ComponentUsagePeriod } from '../types';
import { getMinimumOdometer } from '../utilities/getMinimumOdometer';

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

/**
 * Builds a collection from components in order.
 *
 * @param components - The components.
 * @returns The collection.
 */
function collection(...components: BicycleComponent[]): ComponentCollection {
  return {
    byId: Object.fromEntries(components.map((component) => [component.id, component])),
    allIds: components.map(({ id }) => id),
  };
}

describe('getMinimumOdometer', () => {
  it('is 0 without components or periods', () => {
    expect(getMinimumOdometer(collection(), 'bike-1')).toBe(0);
    expect(getMinimumOdometer(collection(storedComponent('chain-1', 'chain', 'X12')), 'bike-1')).toBe(0);
  });

  it('takes the latest start or end reading over every component and period on the bicycle', () => {
    const components = collection(
      storedComponent('chain-a', 'chain', 'X12', { usage: [period('bike-1', 0, 1500), period('bike-1', 3100, null)] }),
      storedComponent('chain-b', 'chain', 'X12', { usage: [period('bike-1', 1500, 3100)] }),
      storedComponent('cassette', 'cassette', 'XT', { usage: [period('bike-1', 0, null)] }),
    );

    expect(getMinimumOdometer(components, 'bike-1')).toBe(3100);
  });

  it('counts an end above every start', () => {
    const components = collection(storedComponent('chain-a', 'chain', 'X12', { usage: [period('bike-1', 100, 900)] }));

    expect(getMinimumOdometer(components, 'bike-1')).toBe(900);
  });

  it('ignores periods on other bicycles', () => {
    const components = collection(
      storedComponent('chain-a', 'chain', 'X12', { usage: [period('bike-2', 0, 8000), period('bike-1', 0, 200)] }),
    );

    expect(getMinimumOdometer(components, 'bike-1')).toBe(200);
  });
});
