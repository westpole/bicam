import type { BicycleComponent, BicycleComponentType } from '../types';
import { getDefaultLimits } from '../utilities/getDefaultLimits';

/**
 * Builds a stored component fixture as `addComponent` creates it: no label, a starting distance of 0, the default
 * limits of its type, no usage, not retired, and no history.
 *
 * @param id - The component id (fixtures use readable ids instead of UUIDs).
 * @param type - The component type.
 * @param model - The component model.
 * @param overrides - Fields to replace.
 * @returns The component.
 * @example
 * storedComponent('chain-1', 'chain', 'CN-M8100', { usage: [period] });
 */
export function storedComponent(
  id: string,
  type: BicycleComponentType,
  model: string,
  overrides: Partial<BicycleComponent> = {},
): BicycleComponent {
  return {
    id,
    type,
    model,
    label: null,
    initialDistance: 0,
    limits: getDefaultLimits(type),
    usage: [],
    retired: null,
    history: [],
    ...overrides,
  };
}
