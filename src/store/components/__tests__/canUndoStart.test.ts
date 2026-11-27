import { storedComponent } from '../__mocks__/storedComponent';
import type { BicycleComponent, ComponentCollection, ComponentUsagePeriod } from '../types';
import { canUndoStart } from '../utilities/canUndoStart';

/**
 * Builds a usage period on `bike-1`.
 *
 * @param id - The period id.
 * @param start - The start reading.
 * @param end - The end reading, or `null` while in use.
 * @param options - Other fields.
 * @param options.date - The start date; known by default.
 * @param options.replacedPeriodId - What it replaced; `null` by default.
 * @returns The period.
 */
function period(
  id: string,
  start: number,
  end: number | null,
  { date = '2026-04-12', replacedPeriodId = null }: { date?: string | null; replacedPeriodId?: string | null } = {},
): ComponentUsagePeriod {
  return {
    id,
    bicycleId: 'bike-1',
    start: { date, odometer: start },
    end: end === null ? null : { date: null, odometer: end },
    replacedPeriodId,
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

describe('canUndoStart', () => {
  const chainB = storedComponent('b', 'chain', 'X12', { usage: [period('p-b', 0, 1500)] });
  const cassette = storedComponent('cassette', 'cassette', 'CS', { usage: [period('p-cs', 0, null)] });

  it('offers a start that replaced another component, even when it is not the latest boundary', () => {
    const chainA = storedComponent('a', 'chain', 'X12', { usage: [period('p-a', 1500, null, { replacedPeriodId: 'p-b' })] });
    const tire = storedComponent('tire', 'tire', 'GP', { usage: [period('p-t', 2000, null)] });

    expect(canUndoStart(collection(chainA, chainB, tire), 'a')).toBe(true);
  });

  it('offers a start that is the latest boundary on the bicycle', () => {
    const tire = storedComponent('tire', 'tire', 'GP', { usage: [period('p-t', 1500, null)] });

    expect(canUndoStart(collection(chainB, tire, cassette), 'tire')).toBe(true);
  });

  it('does not offer an older start that replaced nothing', () => {
    expect(canUndoStart(collection(chainB, cassette), 'cassette')).toBe(false);
  });

  it('never offers a start without a date', () => {
    const chainA = storedComponent('a', 'chain', 'X12', {
      usage: [period('p-a', 1500, null, { date: null, replacedPeriodId: 'p-b' })],
    });

    expect(canUndoStart(collection(chainA, chainB), 'a')).toBe(false);
  });

  it('does not offer a resting or unknown component', () => {
    expect(canUndoStart(collection(chainB), 'b')).toBe(false);
    expect(canUndoStart(collection(chainB), 'unknown')).toBe(false);
  });
});
