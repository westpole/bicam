import type { ComponentId } from '../../components/types';
import type { BicycleCollection, BicycleId } from '../types';

/**
 * Appends a component id to one bicycle's `components`. Does not mutate `collection`; the other bicycles keep their
 * references. Checks nothing: the caller makes sure that the bicycle is stored, has room, and does not list the id yet.
 *
 * @param collection - The current bicycle collection.
 * @param bicycleId - The id of a stored bicycle.
 * @param componentId - The component id to append.
 * @returns A new collection.
 * @example
 * linkComponent(collection, bicycleId, 'chain-1').byId[bicycleId].components; // ends with 'chain-1'
 */
export function linkComponent(
  collection: BicycleCollection,
  bicycleId: BicycleId,
  componentId: ComponentId,
): BicycleCollection {
  const bicycle = collection.byId[bicycleId];

  return {
    byId: { ...collection.byId, [bicycleId]: { ...bicycle, components: [...bicycle.components, componentId] } },
    allIds: collection.allIds,
  };
}
