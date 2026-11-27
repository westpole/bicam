import type { BicycleCollection, BicycleId } from '../../bicycle/types';
import { hasBicycle } from '../../bicycle/utilities/hasBicycle';
import type { ComponentCollection, ComponentId, StartRange } from '../types';
import { hasComponent } from './hasComponent';
import { planComponentStart } from './planComponentStart';

/**
 * Lists the readings where a start can first become valid: 0 and every boundary of the periods of one type on one
 * bicycle, up to the bicycle's odometer, ascending. Between two boundaries the rules of a start give the same answer
 * as at the lower one (intervals are half-open), so the lowest valid reading is always one of these.
 *
 * @param components - The component collection.
 * @param bicycleId - The bicycle.
 * @param componentId - The component that starts; its type selects the periods.
 * @param odometer - The bicycle's odometer, the highest reading a start accepts.
 * @returns The candidate readings, without duplicates.
 */
function getCandidates(
  components: ComponentCollection,
  bicycleId: BicycleId,
  componentId: ComponentId,
  odometer: number,
): number[] {
  const { type } = components.byId[componentId];
  const readings = new Set([0]);

  for (const id of components.allIds) {
    const other = components.byId[id];

    if (other.type !== type) {
      continue;
    }

    for (const { bicycleId: periodBicycleId, start, end } of other.usage) {
      if (periodBicycleId === bicycleId) {
        readings.add(start.odometer);

        if (end !== null) {
          readings.add(end.odometer);
        }
      }
    }
  }

  return [...readings].filter((reading) => reading <= odometer).sort((a, b) => a - b);
}

/**
 * Finds the readings at which `startComponentUse` accepts a start (rule 4 in `docs/store/components.md` §2.3), so a
 * form can name them after an `outOfRange` error. `min` is the lowest accepted reading: at or above the component's
 * own latest boundary on the bicycle and the start of the replaced period, and where the type stays within
 * `ACTIVE_LIMITS` from then on. `max` is the bicycle's odometer. Uses the store's own check, so the two never disagree.
 * Only the reading is judged: errors on other fields (a missing or wrong `replaces`, a component that cannot start) are
 * ignored, so the range is found even while those are still wrong. The capacity check is then skipped, as the store
 * skips it.
 *
 * @param bicycles - The bicycle collection.
 * @param components - The component collection.
 * @param bicycleId - The bicycle to start the component on.
 * @param componentId - The component to start.
 * @param replaces - The component it replaces, or `null` for none.
 * @returns The range, or `null` for an unknown id or when no reading is accepted.
 * @example
 * // Chain A ran from 1500 to 3100 and chain B is in use since 3100; the odometer is 4500.
 * getStartRange(bicycles, components, bikeId, chainA, chainB); // { min: 3100, max: 4500 }
 */
export function getStartRange(
  bicycles: BicycleCollection,
  components: ComponentCollection,
  bicycleId: BicycleId,
  componentId: ComponentId,
  replaces: ComponentId | null,
): StartRange | null {
  if (!hasBicycle(bicycles, bicycleId) || !hasComponent(components, componentId)) {
    return null;
  }

  const { odometer } = bicycles.byId[bicycleId];
  const min = getCandidates(components, bicycleId, componentId, odometer).find((reading) => {
    const plan = planComponentStart(bicycles, components, bicycleId, componentId, {
      date: null,
      odometer: reading,
      replaces,
    });

    return plan.ok || !plan.errors.some(({ field }) => field === 'odometer');
  });

  return min === undefined ? null : { min, max: odometer };
}
