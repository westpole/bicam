import type { ComponentInput, ComponentLimits } from '@store/components/types';

import { parseNumber } from '../../utilities/parseNumber';
import { LIMIT_FIELDS } from '../constants';
import type { AddComponentValues } from '../types';
import { hasChainLimits } from './hasChainLimits';

/**
 * Turns the draft into the store's input. Text is passed as typed; the store trims and checks it.
 *
 * - An empty starting distance is left out, so the store stores 0.
 * - An empty limit is `null` (no limit). Chain-only limits are left out for other types, also edited ones, so a hidden
 *   field never blocks a save.
 * - Text that is not a number becomes `NaN`, which the store rejects.
 *
 * @param values - The draft.
 * @returns The input for `addComponent`.
 * @example
 * toComponentInput({ ...EMPTY_ADD_COMPONENT_VALUES, type: 'tire', model: 'GP5000', 'limits.stretch': '0.5' });
 * // { type: 'tire', model: 'GP5000', label: '', limits: { distance: null } }
 */
export function toComponentInput(values: AddComponentValues): ComponentInput {
  const isChain = hasChainLimits(values.type);
  const limits: Partial<ComponentLimits> = {};

  for (const { field, limit } of LIMIT_FIELDS) {
    if (limit !== undefined && (limit === 'distance' || isChain)) {
      limits[limit] = parseNumber(values[field]);
    }
  }

  const initialDistance = parseNumber(values.initialDistance);

  return {
    type: values.type,
    model: values.model,
    label: values.label,
    ...(initialDistance === null ? {} : { initialDistance }),
    limits,
  };
}
