import type { ComponentId } from '../../components/types';
import type { Bicycle, BicycleCollection, BicycleId } from '../types';

/**
 * Removes a component id from every bicycle that lists it. Does not mutate `collection`; bicycles that do not list the
 * id keep their references.
 *
 * @param collection - The current bicycle collection.
 * @param componentId - The exact component id to remove.
 * @returns A new collection, or `collection` itself when no bicycle lists the id.
 * @example
 * unlinkComponent(collection, 'chain-1').byId[bicycleId].components; // without 'chain-1'
 */
export function unlinkComponent(collection: BicycleCollection, componentId: ComponentId): BicycleCollection {
  const unlinked = Object.values(collection.byId)
    .filter(({ components }) => components.includes(componentId))
    .map((bicycle): [BicycleId, Bicycle] => [
      bicycle.id,
      { ...bicycle, components: bicycle.components.filter((id) => id !== componentId) },
    ]);

  if (unlinked.length === 0) {
    return collection;
  }

  return { byId: { ...collection.byId, ...Object.fromEntries(unlinked) }, allIds: collection.allIds };
}
