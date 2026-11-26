import type { Bicycle } from '../../bicycle/types';
import { storedComponent } from '../__mocks__/storedComponent';
import type { ComponentCollection, ComponentUsagePeriod } from '../types';
import { closeUsageOnBicycle } from '../utilities/closeUsageOnBicycle';

const BIKE: Bicycle = {
  id: 'bike-1',
  name: 'Roadie',
  company: 'Canyon',
  model: 'Grizl',
  purchased: null,
  size: null,
  frameGeometry: null,
  components: ['chain-a', 'chain-b'],
  odometer: 900,
  odometerDate: '2026-05-01',
};

/**
 * Builds a usage period without dates.
 *
 * @param id - The period id.
 * @param bicycleId - The bicycle.
 * @param start - The start reading.
 * @param end - The end reading, or `null` while open.
 * @returns The period.
 */
function period(id: string, bicycleId: string, start: number, end: number | null): ComponentUsagePeriod {
  return {
    id,
    bicycleId,
    start: { date: null, odometer: start },
    end: end === null ? null : { date: null, odometer: end },
    replacedPeriodId: null,
  };
}

/**
 * Builds a collection of chains with the given usage.
 *
 * @param usage - Periods per component id.
 * @returns The collection.
 */
function collectionOf(usage: Record<string, ComponentUsagePeriod[]>): ComponentCollection {
  const components = Object.entries(usage).map(([id, periods]) =>
    storedComponent(id, 'chain', 'Model', { usage: periods }),
  );

  return {
    byId: Object.fromEntries(components.map((component) => [component.id, component])),
    allIds: components.map(({ id }) => id),
  };
}

describe('closeUsageOnBicycle', () => {
  it('closes the open period at the odometer and its date, without mutating the input', () => {
    const collection = collectionOf({ 'chain-a': [period('p-a', 'bike-1', 100, null)], 'chain-b': [] });
    const snapshot = structuredClone(collection);

    const next = closeUsageOnBicycle(collection, BIKE, ['chain-a']);

    expect(next.byId['chain-a'].usage).toEqual([
      { ...period('p-a', 'bike-1', 100, null), end: { date: '2026-05-01', odometer: 900 } },
    ]);
    expect(next.byId['chain-b']).toBe(collection.byId['chain-b']);
    expect(next.allIds).toBe(collection.allIds);
    expect(collection).toEqual(snapshot);
  });

  it('drops a period of zero length and keeps the closed ones', () => {
    const collection = collectionOf({
      'chain-a': [period('p-old', 'bike-1', 0, 500), period('p-a', 'bike-1', 900, null)],
    });

    expect(closeUsageOnBicycle(collection, BIKE, ['chain-a']).byId['chain-a'].usage).toEqual([
      period('p-old', 'bike-1', 0, 500),
    ]);
  });

  it('drops an open period that starts above the odometer instead of ending it before its start', () => {
    const collection = collectionOf({ 'chain-a': [period('p-a', 'bike-1', 950, null)] });

    expect(closeUsageOnBicycle(collection, BIKE, ['chain-a']).byId['chain-a'].usage).toEqual([]);
  });

  it.each([
    ['an unknown id', ['missing', 'toString']],
    ['a resting component', ['chain-b']],
    ['a component in use on another bicycle', ['chain-c']],
    ['no ids', []],
  ])('returns the same collection for %s', (_, ids) => {
    const collection = collectionOf({
      'chain-b': [period('p-b', 'bike-1', 0, 500)],
      'chain-c': [period('p-c', 'bike-2', 0, null)],
    });

    expect(closeUsageOnBicycle(collection, BIKE, ids)).toBe(collection);
  });
});
