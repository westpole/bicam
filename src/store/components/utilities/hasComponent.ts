import type { ComponentCollection, ComponentId } from '../types';

/**
 * Checks whether a component with exactly this id is stored. Uses an own-property check, so a caller-supplied id such
 * as `'toString'` or `'__proto__'` never matches an inherited object property.
 *
 * @param collection - The component collection.
 * @param id - The exact (case-sensitive) id to look up.
 * @returns `true` when `collection.byId` holds a component under `id`.
 * @example
 * hasComponent({ byId: {}, allIds: [] }, 'toString'); // false
 */
export function hasComponent(collection: ComponentCollection, id: ComponentId): boolean {
  return Object.prototype.hasOwnProperty.call(collection.byId, id);
}
