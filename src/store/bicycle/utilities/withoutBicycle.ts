import type { BicycleCollection, BicycleId } from '../types';

/**
 * Removes one bicycle from a collection. Does not mutate `collection`; the other bicycles keep their references.
 * Checks nothing: the caller makes sure that the bicycle is stored.
 *
 * @param collection - The current bicycle collection.
 * @param id - The id of a stored bicycle.
 * @returns A new collection without the bicycle.
 * @example
 * withoutBicycle(collection, bicycleId).allIds; // without bicycleId
 */
export function withoutBicycle(collection: BicycleCollection, id: BicycleId): BicycleCollection {
  return {
    byId: Object.fromEntries(Object.entries(collection.byId).filter(([storedId]) => storedId !== id)),
    allIds: collection.allIds.filter((storedId) => storedId !== id),
  };
}
