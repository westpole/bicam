import type { Bicycle, BicycleCollection } from '../types';
import { unlinkComponent } from '../utilities/unlinkComponent';

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
    gravel: createBicycle('gravel', ['wheel-1', 'chain-1', 'saddle-1']),
    roadie: createBicycle('roadie', ['chain-2']),
    spare: createBicycle('spare', ['chain-1']),
    empty: createBicycle('empty', []),
  },
  allIds: ['spare', 'gravel', 'empty', 'roadie'],
};

describe('unlinkComponent', () => {
  it('removes the id from every bicycle that lists it and keeps the order of the others', () => {
    expect(unlinkComponent(COLLECTION, 'chain-1')).toStrictEqual({
      byId: {
        ...COLLECTION.byId,
        gravel: createBicycle('gravel', ['wheel-1', 'saddle-1']),
        spare: createBicycle('spare', []),
      },
      allIds: COLLECTION.allIds,
    });
  });

  it('keeps the references of allIds and of the bicycles that do not list the id', () => {
    const { byId, allIds } = unlinkComponent(COLLECTION, 'chain-1');

    expect(byId.roadie).toBe(COLLECTION.byId.roadie);
    expect(byId.empty).toBe(COLLECTION.byId.empty);
    expect(allIds).toBe(COLLECTION.allIds);
  });

  it.each(['unknown-id', 'chain', 'CHAIN-1', 'toString', '__proto__'])(
    'returns the same collection when no bicycle lists %j',
    (id) => {
      expect(unlinkComponent(COLLECTION, id)).toBe(COLLECTION);
    },
  );

  it('does not mutate the collection', () => {
    const snapshot = structuredClone(COLLECTION);

    unlinkComponent(COLLECTION, 'chain-1');

    expect(COLLECTION).toStrictEqual(snapshot);
  });
});
