/**
 * Drops keys whose value is `undefined`, so an update action merges only the keys the caller actually set (`null` is
 * kept, because it clears a field).
 *
 * @param changes - Raw update.
 * @returns A new object with the same keys as `changes`, minus those set to `undefined`.
 * @example
 * definedChanges({ size: undefined, frameGeometry: null }); // { frameGeometry: null }
 */
export function definedChanges<T extends object>(changes: T): Partial<T> {
  return Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)) as Partial<T>;
}
