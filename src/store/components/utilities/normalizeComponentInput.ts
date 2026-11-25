import { toOptionalText } from '../../common/utilities/toOptionalText';
import { COMPONENT_LIMIT_KEYS } from '../constants';
import type { ComponentInput, ComponentInputBase, ComponentLimits, NormalizedComponentInput } from '../types';

/**
 * Turns `-0` into `0`, because `-0` does not survive a JSON round trip.
 *
 * @param value - A number, or `null`.
 * @returns The same value, with `-0` replaced.
 */
function toJsonNumber<T extends number | null>(value: T): T {
  // `-0 === 0` is true, so this branch also replaces -0.
  return (value === 0 ? 0 : value) as T;
}

/**
 * Converts raw component input into complete details without validating them. Picks known fields only, so an `id`, a
 * `history`, `usage`, `retired`, or any other extra key is dropped, and does not mutate `input` or `base`.
 *
 * - Trims `type`, `model`, and `label`; a missing, `null`, or blank `label` becomes `null`.
 * - A missing `initialDistance`, or a missing or `undefined` limit, takes the value in `base`.
 * - `-0` becomes `0`.
 *
 * @param input - Raw component input.
 * @param base - Values for what `input` leaves out: the type's defaults for a new component, the stored values in an
 * update.
 * @returns New component details, ready for `validateComponent`.
 * @example
 * normalizeComponentInput(
 *   { type: ' chain ', model: ' KMC X12 ', label: ' A ', limits: { stretch: 0.75 } },
 *   { initialDistance: 0, limits: getDefaultLimits('chain') },
 * );
 * // { type: 'chain', model: 'KMC X12', label: 'A', initialDistance: 0,
 * //   limits: { distance: null, stretch: 0.75, lubrication: 300, cleaning: 1500 } }
 */
export function normalizeComponentInput(input: ComponentInput, base: ComponentInputBase): NormalizedComponentInput {
  const limits: ComponentLimits = { ...base.limits };

  for (const key of COMPONENT_LIMIT_KEYS) {
    const value = input.limits?.[key];

    if (value !== undefined) {
      limits[key] = toJsonNumber(value);
    }
  }

  return {
    type: input.type.trim(),
    model: input.model.trim(),
    label: toOptionalText(input.label),
    initialDistance: toJsonNumber(input.initialDistance ?? base.initialDistance),
    limits,
  };
}
