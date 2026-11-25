import { DEFAULT_COMPONENT_LIMITS, EMPTY_COMPONENT_LIMITS } from '../constants';
import type { BicycleComponentType, ComponentLimits } from '../types';

/**
 * Returns the suggested limits of a type, for a new component or after a type change.
 *
 * @param type - The component's type.
 * @returns A new object, so a stored component never shares the frozen defaults.
 * @example
 * getDefaultLimits('chain'); // { distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 }
 * getDefaultLimits('tire');  // { distance: null, stretch: null, lubrication: null, cleaning: null }
 */
export function getDefaultLimits(type: BicycleComponentType): ComponentLimits {
  return { ...(DEFAULT_COMPONENT_LIMITS[type] ?? EMPTY_COMPONENT_LIMITS) };
}
