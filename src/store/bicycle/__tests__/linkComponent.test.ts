import type { Bicycle, BicycleCollection } from '../types';
import { linkComponent } from '../utilities/linkComponent';

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
  byId: { gravel: createBicycle('gravel', ['wheel-1']), roadie: createBicycle('roadie', []) },
  allIds: ['roadie', 'gravel'],
};

describe('linkComponent', () => {
  it('appends the id to the bicycle and leaves the others alone', () => {
    const linked = linkComponent(COLLECTION, 'gravel', 'chain-1');

    expect(linked).toStrictEqual({
      byId: { ...COLLECTION.byId, gravel: createBicycle('gravel', ['wheel-1', 'chain-1']) },
      allIds: ['roadie', 'gravel'],
    });
    expect(linked.byId.roadie).toBe(COLLECTION.byId.roadie);
    expect(linked.allIds).toBe(COLLECTION.allIds);
  });

  it('does not mutate the collection', () => {
    const snapshot = structuredClone(COLLECTION);

    linkComponent(COLLECTION, 'gravel', 'chain-1');

    expect(COLLECTION).toStrictEqual(snapshot);
  });
});
