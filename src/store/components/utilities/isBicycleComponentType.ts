import { COMPONENT_TYPES } from '../constants';
import type { BicycleComponentType } from '../types';

/**
 * Checks whether a raw string is a known component type. Matches exactly (case-sensitive).
 *
 * @param value - The string to check.
 * @returns `true` when `value` is one of `COMPONENT_TYPES`; narrows it to {@link BicycleComponentType}.
 * @example
 * isBicycleComponentType('chain');    // true
 * isBicycleComponentType('Chain');    // false
 * isBicycleComponentType('toString'); // false
 */
export function isBicycleComponentType(value: string): value is BicycleComponentType {
  return COMPONENT_TYPES.some((type) => type === value);
}
