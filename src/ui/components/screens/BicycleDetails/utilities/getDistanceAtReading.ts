import { COMPONENT_LIMITS } from '@store/components/constants';
import type { ComponentUsage } from '@store/components/types';

import type { ReadingDistance } from '../types';
import { getReadingRange } from './getReadingRange';

/**
 * Finds a component's own distance at an odometer reading of its bicycle, for a care entry entered late
 * (`tickets/plan.md`, History readings). In use, the component ran every kilometre since its installation, so its
 * distance then was `distance − (odometer − reading)`; a reading outside `getReadingRange` (above the odometer, or
 * before the installation, where the component may not have run) is rejected. A resting component gets its current
 * distance. A filled-in distance is capped at `COMPONENT_LIMITS.distanceMax`, the most a history entry accepts.
 *
 * @param usage - The component's usage (`getComponentUsage`): its distance, and the distance since installed while in
 * use.
 * @param odometer - The bicycle's current odometer.
 * @param reading - The odometer at the moment of the entry; ignored for a resting component.
 * @returns The distance, or why the reading cannot be used with the readings that can.
 * @example
 * // Chain A at 2900 km, in use since 3100; the odometer is 4500.
 * getDistanceAtReading({ distance: 2900, distanceSinceInstalled: 1400 }, 4500, 4000); // { ok: true, distance: 2400 }
 * getDistanceAtReading({ distance: 2900, distanceSinceInstalled: 1400 }, 4500, 3000);
 * // { ok: false, code: 'beforeInstallation', min: 3100, max: 4500 }
 */
export function getDistanceAtReading(
  usage: Pick<ComponentUsage, 'distance' | 'distanceSinceInstalled'>,
  odometer: number,
  reading: number,
): ReadingDistance {
  const { distance } = usage;
  const range = getReadingRange(usage, odometer);

  if (range === null) {
    return { ok: true, distance: Math.min(distance, COMPONENT_LIMITS.distanceMax) };
  }

  if (reading > range.max) {
    return { ok: false, code: 'aboveOdometer', ...range };
  }

  if (reading < range.min) {
    return { ok: false, code: 'beforeInstallation', ...range };
  }

  // Rounded to 1 decimal, like the range, so floating-point differences stay exact.
  const atReading = Math.round((distance - (odometer - reading)) * 10) / 10;

  return { ok: true, distance: Math.min(atReading, COMPONENT_LIMITS.distanceMax) };
}
