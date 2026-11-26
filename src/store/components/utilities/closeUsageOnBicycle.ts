import type { Bicycle } from '../../bicycle/types';
import type { BicycleComponent, ComponentCollection, ComponentId, OdometerReading } from '../types';
import { findOpenPeriod } from './findOpenPeriod';
import { hasComponent } from './hasComponent';

/**
 * Closes the open period on `bicycle` of each listed component (rule 8 in `docs/store/components.md` §2.3), for a
 * component that leaves the bicycle or a bicycle that is removed. The period ends at the bicycle's odometer and
 * odometer date, and keeps the bicycle's id. A period of zero length is dropped (rule 7). Components that are not
 * stored, or not in use on this bicycle, are skipped. Does not mutate `collection`.
 *
 * @param collection - The current component collection.
 * @param bicycle - The stored bicycle the components leave, as it was before the change.
 * @param componentIds - The components that leave it.
 * @returns A new collection, or `collection` itself when no listed component is in use on the bicycle.
 * @example
 * closeUsageOnBicycle(state.components, state.bicycle.byId[bicycleId], ['chain-1']);
 */
export function closeUsageOnBicycle(
  collection: ComponentCollection,
  bicycle: Bicycle,
  componentIds: readonly ComponentId[],
): ComponentCollection {
  const end: OdometerReading = { date: bicycle.odometerDate, odometer: bicycle.odometer };
  const closed = componentIds.flatMap((componentId): Array<[ComponentId, BicycleComponent]> => {
    const component = hasComponent(collection, componentId) ? collection.byId[componentId] : undefined;
    const period = component && findOpenPeriod(component);

    if (!component || !period || period.bicycleId !== bicycle.id) {
      return [];
    }

    // Rule 6 keeps the odometer at or above the start, so this is a zero-length period. `<=` also drops a period that
    // would end before its start, should saved data ever break rule 6, instead of storing it inverted.
    const usage =
      end.odometer <= period.start.odometer
        ? component.usage.filter(({ id }) => id !== period.id)
        : component.usage.map((other) => (other.id === period.id ? { ...other, end } : other));

    return [[componentId, { ...component, usage }]];
  });

  if (closed.length === 0) {
    return collection;
  }

  return { byId: { ...collection.byId, ...Object.fromEntries(closed) }, allIds: collection.allIds };
}
