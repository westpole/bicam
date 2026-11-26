import { BICYCLE_LIMITS } from '../../bicycle/constants';
import type { BicycleCollection, BicycleId } from '../../bicycle/types';
import { hasBicycle } from '../../bicycle/utilities/hasBicycle';
import { linkComponent } from '../../bicycle/utilities/linkComponent';
import type {
  ComponentAssignPlan,
  ComponentAssignValidationError,
  ComponentCollection,
  ComponentId,
  ComponentStartInput,
} from '../types';
import { hasComponent } from './hasComponent';
import { planComponentStart } from './planComponentStart';

/**
 * Validates and prepares `assignComponent` without writing: appends the component's id to the bicycle and, with `use`,
 * starts it there (`planComponentStart`). Each check is returned alone, in this order:
 *
 * - `notFound` on `bicycleId`, then on `componentId`, for an unknown id;
 * - `notAllowed` on `componentId` when the component is retired or already listed on a bicycle (this one included);
 * - `tooMany` on `components` when the bicycle already lists `BICYCLE_LIMITS.componentsMaxCount` components.
 *
 * After the link, the start's errors are returned with their own field names (`replaces`, `odometer`, `date`, `usage`).
 *
 * @param bicycles - The bicycle collection.
 * @param components - The component collection.
 * @param bicycleId - The bicycle to put the component on.
 * @param componentId - The component to assign.
 * @param use - When given, the reading at which it starts, and the component it replaces; when left out, it rests.
 * @returns The assigned component and both next collections, or every failing field.
 * @example
 * const plan = planComponentAssign(state.bicycle, state.components, bikeId, chainId, { date: today, odometer: 1500 });
 * if (plan.ok) set({ bicycle: plan.bicycles, components: plan.components });
 */
export function planComponentAssign(
  bicycles: BicycleCollection,
  components: ComponentCollection,
  bicycleId: BicycleId,
  componentId: ComponentId,
  use?: ComponentStartInput,
): ComponentAssignPlan {
  const fail = (error: ComponentAssignValidationError): ComponentAssignPlan => ({ ok: false, errors: [error] });

  if (!hasBicycle(bicycles, bicycleId)) {
    return fail({ field: 'bicycleId', code: 'notFound' });
  }

  if (!hasComponent(components, componentId)) {
    return fail({ field: 'componentId', code: 'notFound' });
  }

  const component = components.byId[componentId];
  const isListed = bicycles.allIds.some((id) => bicycles.byId[id].components.includes(componentId));

  if (component.retired !== null || isListed) {
    return fail({ field: 'componentId', code: 'notAllowed' });
  }

  if (bicycles.byId[bicycleId].components.length >= BICYCLE_LIMITS.componentsMaxCount) {
    return fail({ field: 'components', code: 'tooMany' });
  }

  const nextBicycles = linkComponent(bicycles, bicycleId, componentId);

  if (use === undefined) {
    return { ok: true, component, bicycles: nextBicycles, components };
  }

  const start = planComponentStart(nextBicycles, components, bicycleId, componentId, use);

  if (!start.ok) {
    return start;
  }

  return {
    ok: true,
    component: start.component,
    bicycles: nextBicycles,
    components: {
      byId: { ...components.byId, ...Object.fromEntries(start.changed.map((changed) => [changed.id, changed])) },
      allIds: components.allIds,
    },
  };
}
