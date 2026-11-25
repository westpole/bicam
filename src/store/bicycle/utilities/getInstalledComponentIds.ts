import type { ComponentId } from '../../components/types';
import type { BicycleCollection, BicycleId } from '../types';

/**
 * Collects the ids of the components that are on a bicycle. A component that is not among them is spare.
 *
 * @param collection - The bicycle collection.
 * @param ignoreId - Id of a bicycle to leave out, to find what is on the other ones.
 * @returns The installed component ids.
 * @example
 * getInstalledComponentIds(state.bicycle).has('chain-1'); // true when any bicycle lists 'chain-1'
 */
export function getInstalledComponentIds(
  collection: BicycleCollection,
  ignoreId?: BicycleId,
): ReadonlySet<ComponentId> {
  return new Set(
    Object.values(collection.byId)
      .filter(({ id }) => id !== ignoreId)
      .flatMap(({ components }) => components),
  );
}
