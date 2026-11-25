import type { Bicycle, BicycleCollection } from '../types';
import { getInstalledComponentIds } from '../utilities/getInstalledComponentIds';

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
  };
}

const COLLECTION: BicycleCollection = {
  byId: {
    gravel: createBicycle('gravel', ['wheel-1', 'chain-1']),
    roadie: createBicycle('roadie', ['chain-2']),
    empty: createBicycle('empty', []),
  },
  allIds: ['gravel', 'roadie', 'empty'],
};

describe('getInstalledComponentIds', () => {
  it('collects the components of every bicycle', () => {
    expect([...getInstalledComponentIds(COLLECTION)].sort()).toEqual(['chain-1', 'chain-2', 'wheel-1']);
  });

  it('leaves out the components of the ignored bicycle', () => {
    expect([...getInstalledComponentIds(COLLECTION, 'gravel')]).toEqual(['chain-2']);
  });

  it('is empty when there are no bicycles', () => {
    expect(getInstalledComponentIds({ byId: {}, allIds: [] }).size).toBe(0);
  });
});
