import { DEFAULT_COMPONENT_LIMITS, EMPTY_COMPONENT_LIMITS } from '../constants';
import type { ComponentLimits } from '../types';
import { isBicycleComponentType } from './isBicycleComponentType';

/**
 * Returns the suggested limits of a type, for a new component or after a type change.
 *
 * @param type - The component's type, possibly not checked yet; an unknown type has no limits.
 * @returns A new object, so a stored component never shares the frozen defaults.
 * @example
 * getDefaultLimits('chain');  // { distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 }
 * getDefaultLimits('engine'); // { distance: null, stretch: null, lubrication: null, cleaning: null }
 */
export function getDefaultLimits(type: string): ComponentLimits {
  const defaults = isBicycleComponentType(type) ? DEFAULT_COMPONENT_LIMITS[type] : undefined;

  return { ...(defaults ?? EMPTY_COMPONENT_LIMITS) };
}
