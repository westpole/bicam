import type { BicycleComponent, ComponentAddPlan, ComponentCollection, ComponentInput } from '../types';
import { createComponentId } from './createComponentId';
import { getDefaultLimits } from './getDefaultLimits';
import { normalizeComponentInput } from './normalizeComponentInput';
import { validateComponent } from './validateComponent';

/**
 * Validates and prepares `addComponent` without writing. A missing `initialDistance` is 0, and missing limits take the
 * type's defaults. The new component has a generated id, no usage, and an empty history.
 *
 * @param collection - The current component collection.
 * @param input - Raw component input.
 * @returns The new component and the next collection, or every failing field. No id is generated on failure.
 * @example
 * const plan = planComponentAdd(state.components, { type: 'chain', model: 'CN-M8100' });
 * if (plan.ok) set({ components: plan.collection });
 */
export function planComponentAdd(collection: ComponentCollection, input: ComponentInput): ComponentAddPlan {
  const base = { initialDistance: 0, limits: getDefaultLimits(input.type.trim()) };
  const validation = validateComponent(normalizeComponentInput(input, base));

  if (!validation.ok) {
    return validation;
  }

  const component: BicycleComponent = {
    id: createComponentId(),
    ...validation.details,
    usage: [],
    retired: null,
    history: [],
  };

  return {
    ok: true,
    component,
    collection: { byId: { ...collection.byId, [component.id]: component }, allIds: [...collection.allIds, component.id] },
  };
}
