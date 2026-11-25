import type { BicycleCollection } from '../../bicycle/types';
import { hasBicycle } from '../../bicycle/utilities/hasBicycle';
import type { BicycleComponent } from '../../components/types';
import { hasComponent } from '../../components/utilities/hasComponent';
import type { PersistedAppState } from '../types';
import { isCollection } from './isCollection';
import { isRecord } from './isRecord';
import { isStoredBicycle } from './isStoredBicycle';
import { isStoredComponent } from './isStoredComponent';

/**
 * Checks rule 1 of `docs/store/components.md` §3 for one component: it has at most one open period, and that period's
 * bicycle is stored and lists the component.
 *
 * @param component - A component with a valid shape.
 * @param bicycles - The bicycle collection.
 * @returns `true` when the component's usage agrees with the bicycles.
 */
function hasValidOpenPeriod(component: BicycleComponent, bicycles: BicycleCollection): boolean {
  const open = component.usage.filter(({ end }) => end === null);

  if (open.length === 0) {
    return true;
  }

  const [{ bicycleId }] = open;

  return (
    open.length === 1 && hasBicycle(bicycles, bicycleId) && bicycles.byId[bicycleId].components.includes(component.id)
  );
}

/**
 * Checks whether untrusted data is a usable {@link PersistedAppState}: both collections are consistent, every bicycle
 * lists stored components only, and every component has at most one open period, on a bicycle that lists it. Extra
 * keys are ignored. Rules that may be tightened later (field limits, `ACTIVE_LIMITS`, overlapping periods, chain-only
 * limits) and references to things that may have been removed (`replacedPeriodId`, the bicycle of a closed period or
 * of `retired`) are not checked.
 *
 * @param value - The parsed data.
 * @returns `true` when `value` can be loaded into the store.
 * @example
 * isPersistedAppState({ bicycle: { byId: {}, allIds: [] }, components: { byId: {}, allIds: [] } }); // true
 */
export function isPersistedAppState(value: unknown): value is PersistedAppState {
  if (!isRecord(value)) {
    return false;
  }

  const { bicycle, components } = value;

  return (
    isCollection(bicycle, isStoredBicycle) &&
    isCollection(components, isStoredComponent) &&
    Object.values(bicycle.byId).every((stored) => stored.components.every((id) => hasComponent(components, id))) &&
    Object.values(components.byId).every((component) => hasValidOpenPeriod(component, bicycle))
  );
}
