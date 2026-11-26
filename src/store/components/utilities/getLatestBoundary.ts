import type { BicycleId } from '../../bicycle/types';
import type { ComponentUsagePeriod } from '../types';

/**
 * Finds the latest boundary (`start` or `end` reading) of the periods that name one bicycle.
 *
 * @param usage - A component's usage periods.
 * @param bicycleId - The bicycle.
 * @returns The latest boundary in kilometres, or `0` when no period names the bicycle (readings are never below 0).
 * @example
 * getLatestBoundary(component.usage, bicycleId); // 3100 after the component came off at 3100
 */
export function getLatestBoundary(usage: readonly ComponentUsagePeriod[], bicycleId: BicycleId): number {
  let latest = 0;

  for (const { bicycleId: periodBicycleId, start, end } of usage) {
    if (periodBicycleId === bicycleId) {
      latest = Math.max(latest, start.odometer, end?.odometer ?? 0);
    }
  }

  return latest;
}
