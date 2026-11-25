import type { Bicycle } from '../../bicycle/types';
import type { BicycleComponent, ComponentCollection } from '../types';
import { getInstalledComponents } from '../utilities/getInstalledComponents';

/**
 * Builds a bicycle with the given components.
 *
 * @param components - Component ids.
 * @returns The bicycle.
 */
function createBicycle(components: string[]): Bicycle {
  return {
    id: 'gravel',
    name: 'Gravel',
    company: 'Canyon',
    model: 'Grizl',
    purchased: null,
    size: null,
    frameGeometry: null,
    components,
  };
}

const CHAIN: BicycleComponent = { id: 'chain-1', type: 'chain', model: 'CN-M8100', history: [] };
const WHEEL: BicycleComponent = { id: 'wheel-1', type: 'wheel', model: 'G1800', history: [] };

const COMPONENTS: ComponentCollection = {
  byId: { 'chain-1': CHAIN, 'wheel-1': WHEEL },
  allIds: ['chain-1', 'wheel-1'],
};

describe('getInstalledComponents', () => {
  it("lists the components in the bicycle's own order", () => {
    expect(getInstalledComponents(COMPONENTS, createBicycle(['wheel-1', 'chain-1']))).toEqual([WHEEL, CHAIN]);
  });

  it('skips ids that are not stored', () => {
    expect(getInstalledComponents(COMPONENTS, createBicycle(['missing', 'toString', 'chain-1']))).toEqual([CHAIN]);
  });

  it('returns an empty list for a bicycle without components', () => {
    expect(getInstalledComponents(COMPONENTS, createBicycle([]))).toEqual([]);
  });
});
