import { getDefaultLimits } from '@store/components/utilities/getDefaultLimits';
import type { ComponentLimits } from '@store/components/types';

import { LIMIT_FIELDS } from '../constants';
import type { AddComponentValues } from '../types';

/**
 * Sets the chosen type and fills the limits the rider has not edited with that type's suggested values, so choosing a
 * chain fills 0.5 %, 300 km, and 1500 km, and choosing another type clears them again.
 *
 * @param values - The draft before the change.
 * @param type - The newly chosen type; `''` when none.
 * @param edited - The limits the rider has typed into; those keep their values.
 * @returns The new draft; `values` is not mutated.
 * @example
 * applyTypeDefaults(EMPTY_ADD_COMPONENT_VALUES, 'chain', new Set());
 * // { ...EMPTY_ADD_COMPONENT_VALUES, type: 'chain', 'limits.stretch': '0.5', 'limits.lubrication': '300',
 * //   'limits.cleaning': '1500' }
 */
export function applyTypeDefaults(
  values: AddComponentValues,
  type: string,
  edited: ReadonlySet<keyof ComponentLimits>,
): AddComponentValues {
  const defaults = getDefaultLimits(type);
  const next: AddComponentValues = { ...values, type };

  for (const { field, limit } of LIMIT_FIELDS) {
    if (limit !== undefined && !edited.has(limit)) {
      next[field] = defaults[limit] === null ? '' : String(defaults[limit]);
    }
  }

  return next;
}
