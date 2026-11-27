import type { ComponentCollection, ComponentId } from '../types';
import { findOpenPeriod } from './findOpenPeriod';
import { getMinimumOdometer } from './getMinimumOdometer';
import { hasComponent } from './hasComponent';

/**
 * Decides whether the UI offers **Undo** for a component (rule 10 in `docs/store/components.md` §2.3): it is in use, its
 * start has a known date, and that start replaced another component or is the latest boundary on its bicycle. An older
 * start that replaced nothing is left alone, because undoing it would remove distance that later swaps depend on; a
 * start without a date (migrated) is never offered.
 *
 * @param components - The component collection.
 * @param componentId - The component.
 * @returns `true` when the start can be offered for undo.
 * @example
 * canUndoStart(state.components, chainA); // true right after the swap B → A
 */
export function canUndoStart(components: ComponentCollection, componentId: ComponentId): boolean {
  if (!hasComponent(components, componentId)) {
    return false;
  }

  const period = findOpenPeriod(components.byId[componentId]);

  if (!period || period.start.date === null) {
    return false;
  }

  return period.replacedPeriodId !== null || period.start.odometer >= getMinimumOdometer(components, period.bicycleId);
}
