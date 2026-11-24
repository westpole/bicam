import type { BicycleComponentType, ComponentHistoryEntry } from '../types';
import { validateComponentHistoryEntry } from './validateComponentHistoryEntry';

/**
 * Checks whether every stored history entry would also be valid on a component of another type.
 *
 * @param type - The type to check against.
 * @param history - Stored history entries.
 * @returns `true` when no entry fails validation for `type`; always `true` for an empty history.
 * @example
 * // entry: a stored `brakes` entry with `subcomponent: 'rotor'`
 * isHistoryValidForType('brakes', [entry]); // true
 * isHistoryValidForType('chain', [entry]);  // false
 */
export function isHistoryValidForType(type: BicycleComponentType, history: readonly ComponentHistoryEntry[]): boolean {
  return history.every((entry) => validateComponentHistoryEntry(type, entry).ok);
}
