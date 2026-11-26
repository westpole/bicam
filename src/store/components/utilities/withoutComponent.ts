import type { ComponentCollection, ComponentId } from '../types';

/**
 * Removes one component, with its history and usage, from a collection. Does not mutate `collection`; the other
 * components keep their references. Checks nothing: the caller makes sure that the component is stored.
 *
 * @param collection - The current component collection.
 * @param id - The id of a stored component.
 * @returns A new collection without the component.
 * @example
 * withoutComponent(collection, 'chain-1').allIds; // without 'chain-1'
 */
export function withoutComponent(collection: ComponentCollection, id: ComponentId): ComponentCollection {
  return {
    byId: Object.fromEntries(Object.entries(collection.byId).filter(([storedId]) => storedId !== id)),
    allIds: collection.allIds.filter((storedId) => storedId !== id),
  };
}
