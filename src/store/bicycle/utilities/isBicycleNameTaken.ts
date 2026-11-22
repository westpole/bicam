import type { BicycleCollection, BicycleId } from '../types';

/**
 * Checks whether another stored bicycle already uses a name, ignoring letter case (`'Roadie'` clashes with
 * `'roadie'`), so two bicycles never show titles that differ only in case.
 *
 * @param collection - The bicycle collection.
 * @param name - The normalized (trimmed) candidate name.
 * @param ignoreId - Id of a bicycle to skip, so a bicycle being updated does not clash with itself.
 * @returns `true` when a bicycle other than `ignoreId` has a name equal to `name` case-insensitively.
 * @example
 * isBicycleNameTaken(collection, 'ROADIE');            // true when 'Roadie' is stored
 * isBicycleNameTaken(collection, 'roadie', roadieId); // false: Roadie may change its own name's case
 */
export function isBicycleNameTaken(collection: BicycleCollection, name: string, ignoreId?: BicycleId): boolean {
  const candidate = name.toLowerCase();

  return collection.allIds.some(
    (storedId) => storedId !== ignoreId && collection.byId[storedId].name.toLowerCase() === candidate,
  );
}
