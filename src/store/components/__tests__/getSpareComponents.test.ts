import { storedComponent } from '../__mocks__/storedComponent';
import type { Bicycle, BicycleCollection } from '../../bicycle/types';
import type { BicycleComponent, ComponentCollection } from '../types';
import { getSpareComponents } from '../utilities/getSpareComponents';

/**
 * Builds a stored bicycle.
 *
 * @param id - The bicycle id.
 * @param components - Ids of its components.
 * @returns The bicycle.
 */
function createBicycle(id: string, components: string[]): Bicycle {
  return {
    id,
    name: id,
    company: 'Canyon',
    model: 'Grizl',
    purchased: null,
    size: null,
    frameGeometry: null,
    components,
    odometer: 0,
    odometerDate: null,
  };
}

const CHAIN: BicycleComponent = storedComponent('chain-1', 'chain', 'CN-M8100');
const WHEEL: BicycleComponent = storedComponent('wheel-1', 'wheel', 'G1800');
const SADDLE: BicycleComponent = storedComponent('saddle-1', 'saddle', 'Argo');
const STEM: BicycleComponent = storedComponent('stem-1', 'stem', 'Superlight');

const COMPONENTS: ComponentCollection = {
  byId: { 'chain-1': CHAIN, 'wheel-1': WHEEL, 'saddle-1': SADDLE, 'stem-1': STEM },
  allIds: ['stem-1', 'chain-1', 'wheel-1', 'saddle-1'],
};

describe('getSpareComponents', () => {
  it('lists the components that no bicycle has, in allIds order', () => {
    const bicycles: BicycleCollection = {
      byId: { gravel: createBicycle('gravel', ['wheel-1']), roadie: createBicycle('roadie', ['chain-1']) },
      allIds: ['gravel', 'roadie'],
    };

    expect(getSpareComponents(COMPONENTS, bicycles)).toEqual([STEM, SADDLE]);
  });

  it('lists every component when there are no bicycles', () => {
    expect(getSpareComponents(COMPONENTS, { byId: {}, allIds: [] })).toEqual([STEM, CHAIN, WHEEL, SADDLE]);
  });
});
