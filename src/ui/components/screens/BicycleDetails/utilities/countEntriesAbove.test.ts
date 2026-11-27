import type { ComponentHistoryEntry } from '@store/components/types';
import { CHAIN_IN_USE_ROW } from '@ui/components/ComponentList/__mocks__/rows';

import { countEntriesAbove } from './countEntriesAbove';

/**
 * Builds a history entry.
 *
 * @param distance - Its distance, or `null` when unknown.
 * @param subcomponent - Its subcomponent, or `null` for the whole component.
 * @returns The entry.
 */
function entry(distance: number | null, subcomponent: ComponentHistoryEntry['subcomponent'] = null): ComponentHistoryEntry {
  return {
    id: `entry-${distance}-${subcomponent}`,
    date: '2026-04-12',
    installed: '2026-03-01',
    distance,
    position: null,
    subcomponent,
    lubricated: null,
    stretch: null,
    lubricant: null,
    cleaned: null,
  };
}

describe('countEntriesAbove', () => {
  it('counts whole-component entries above the distance, not at it', () => {
    const history = [entry(1500), entry(1500.1), entry(2400), entry(null), entry(3000, 'brakePads')];

    expect(countEntriesAbove({ ...CHAIN_IN_USE_ROW.component, history }, 1500)).toBe(2);
  });

  it('is 0 without history', () => {
    expect(countEntriesAbove(CHAIN_IN_USE_ROW.component, 0)).toBe(0);
  });
});
