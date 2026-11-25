import { isRecord } from './isRecord';

/**
 * Checks whether an untrusted value is a normalized entity collection: `allIds` lists every key of `byId` exactly
 * once, and every entity is valid and carries the id it is stored under.
 *
 * @param value - The value to check.
 * @param isEntity - Checks one entity.
 * @returns `true` when `value` is a consistent collection of valid entities.
 * @example
 * isCollection({ byId: {}, allIds: [] }, isStoredBicycle);         // true
 * isCollection({ byId: {}, allIds: ['bike-1'] }, isStoredBicycle); // false
 */
export function isCollection<T extends { id: string }>(
  value: unknown,
  isEntity: (entity: unknown) => entity is T,
): value is { byId: Record<string, T>; allIds: string[] } {
  if (!isRecord(value) || !isRecord(value.byId) || !Array.isArray(value.allIds)) {
    return false;
  }

  const ids = new Set<unknown>(value.allIds);
  const entries = Object.entries(value.byId);

  return (
    ids.size === value.allIds.length &&
    ids.size === entries.length &&
    entries.every(([id, entity]) => ids.has(id) && isEntity(entity) && entity.id === id)
  );
}
