import type { BicycleCollection, BicycleId } from '../types';

/**
 * Checks whether an id is already used by a stored bicycle, ignoring letter case (`'Roadie'` clashes with
 * `'roadie'`), so two bicycles never show titles that differ only in case.
 *
 * @param collection - The bicycle collection.
 * @param id - The normalized (trimmed) candidate id.
 * @returns `true` when any stored id equals `id` case-insensitively.
 * @example
 * isBicycleIdTaken({ byId: { Roadie: bicycle }, allIds: ['Roadie'] }, 'ROADIE'); // true
 */
export function isBicycleIdTaken(collection: BicycleCollection, id: BicycleId): boolean {
  const candidate = id.toLowerCase();

  return collection.allIds.some((storedId) => storedId.toLowerCase() === candidate);
}
