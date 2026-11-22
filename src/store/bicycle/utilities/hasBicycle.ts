import type { BicycleCollection, BicycleId } from '../types';

/**
 * Checks whether a bicycle with exactly this id is stored. Uses an own-property check, so user-defined ids such as
 * `'toString'` or `'__proto__'` never match inherited object properties.
 *
 * @param collection - The bicycle collection.
 * @param id - The exact (case-sensitive) id to look up.
 * @returns `true` when `collection.byId` holds a bicycle under `id`.
 * @example
 * hasBicycle({ byId: {}, allIds: [] }, 'toString'); // false
 */
export function hasBicycle(collection: BicycleCollection, id: BicycleId): boolean {
  return Object.prototype.hasOwnProperty.call(collection.byId, id);
}
