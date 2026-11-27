import type { BicycleComponent } from '@store/components/types';

/**
 * Counts the component's whole-component history entries whose distance is above a distance, for example its distance
 * after an undo. Such entries were logged at readings the undo takes away, so the rider should check them. Subcomponent
 * entries count kilometres since their own `installed` and are left out, like entries without a distance.
 *
 * @param component - The component.
 * @param distance - The distance to compare with, in kilometres.
 * @returns How many entries have a higher distance.
 * @example
 * countEntriesAbove(chainA, 1500); // 1 when a top-up was logged at 2400 km
 */
export function countEntriesAbove(component: BicycleComponent, distance: number): number {
  return component.history.filter(
    (entry) => entry.subcomponent === null && entry.distance !== null && entry.distance > distance,
  ).length;
}
