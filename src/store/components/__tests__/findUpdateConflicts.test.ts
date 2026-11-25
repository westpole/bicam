import { storedComponent } from '../__mocks__/storedComponent';
import type { BicycleComponent, ComponentHistoryEntry, ComponentUsagePeriod } from '../types';
import { findUpdateConflicts } from '../utilities/findUpdateConflicts';

const PERIOD: ComponentUsagePeriod = {
  id: 'period-1',
  bicycleId: 'bike-1',
  start: { date: null, odometer: 0 },
  end: null,
  replacedPeriodId: null,
};

/**
 * Builds a history entry.
 *
 * @param overrides - Fields to replace.
 * @returns The entry.
 */
function entry(overrides: Partial<ComponentHistoryEntry> = {}): ComponentHistoryEntry {
  return {
    id: 'entry-1',
    date: '2026-04-12',
    installed: '2026-03-01',
    distance: null,
    position: null,
    subcomponent: null,
    lubricated: null,
    stretch: null,
    lubricant: null,
    cleaned: null,
    ...overrides,
  };
}

/**
 * Uses a stored component as the merged update, with some fields changed.
 *
 * @param stored - The stored component.
 * @param changes - The changed fields.
 * @returns The normalized update.
 */
function update(stored: BicycleComponent, changes: Partial<BicycleComponent> = {}) {
  return { ...stored, ...changes };
}

describe('findUpdateConflicts', () => {
  const chain = storedComponent('chain-1', 'chain', 'X12', { initialDistance: 120 });

  it('finds none for an unchanged component', () => {
    expect(findUpdateConflicts(chain, update(chain))).toEqual([]);
  });

  it('allows a new type without usage or conflicting history', () => {
    expect(findUpdateConflicts(chain, update(chain, { type: 'cassette' }))).toEqual([]);
  });

  it('rejects a new type once the component has usage periods', () => {
    const used = { ...chain, usage: [PERIOD] };

    expect(findUpdateConflicts(used, update(used, { type: 'cassette' }))).toEqual([
      { field: 'type', code: 'notAllowed' },
    ]);
  });

  it('rejects a new type that a stored history entry is not valid for', () => {
    const lubricated = { ...chain, history: [entry({ lubricated: '2026-04-12' })] };

    expect(findUpdateConflicts(lubricated, update(lubricated, { type: 'cassette' }))).toEqual([
      { field: 'type', code: 'notAllowed' },
    ]);
  });

  it('leaves an unknown type to validation', () => {
    const used = { ...chain, usage: [PERIOD] };

    expect(findUpdateConflicts(used, { ...used, type: 'engine' })).toEqual([]);
  });

  it('rejects a new starting distance once a whole-component entry has a distance', () => {
    const measured = { ...chain, history: [entry({ distance: 500 })] };

    expect(findUpdateConflicts(measured, update(measured, { initialDistance: 0 }))).toEqual([
      { field: 'initialDistance', code: 'notAllowed' },
    ]);
  });

  it('accepts the unchanged starting distance when a whole-component entry has a distance', () => {
    const measured = { ...chain, history: [entry({ distance: 500 })] };

    expect(findUpdateConflicts(measured, update(measured, { model: 'X11' }))).toEqual([]);
  });

  it.each([
    ['a whole-component entry without a distance', entry({ distance: null })],
    ['a subcomponent entry with a distance', entry({ distance: 500, subcomponent: 'rim' })],
  ])('allows a new starting distance with only %s', (_label, historyEntry) => {
    const wheel = storedComponent('wheel-1', 'wheel', 'G1800', { history: [historyEntry] });

    expect(findUpdateConflicts(wheel, update(wheel, { initialDistance: 300 }))).toEqual([]);
  });

  it('reports both conflicts in field order', () => {
    const both = { ...chain, usage: [PERIOD], history: [entry({ distance: 500 })] };

    expect(findUpdateConflicts(both, update(both, { type: 'cassette', initialDistance: 0 }))).toEqual([
      { field: 'type', code: 'notAllowed' },
      { field: 'initialDistance', code: 'notAllowed' },
    ]);
  });
});
