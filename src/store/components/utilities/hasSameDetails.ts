import { COMPONENT_LIMIT_KEYS } from '../constants';
import type { ComponentDetails } from '../types';

/**
 * Checks whether two components have the same user-editable fields, so an update that changes nothing can skip the
 * write.
 *
 * @param a - One component's details.
 * @param b - The other component's details.
 * @returns `true` when the type, model, label, starting distance, and every limit are equal.
 * @example
 * hasSameDetails(stored, { ...stored, label: 'B' }); // false
 */
export function hasSameDetails(a: ComponentDetails, b: ComponentDetails): boolean {
  return (
    a.type === b.type &&
    a.model === b.model &&
    a.label === b.label &&
    a.initialDistance === b.initialDistance &&
    COMPONENT_LIMIT_KEYS.every((key) => a.limits[key] === b.limits[key])
  );
}
