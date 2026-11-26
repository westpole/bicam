import { ACTIVE_LIMITS } from '../constants';
import type { BicycleComponent, BicycleComponentType } from '../types';
import { getComponentsInUse } from './getComponentsInUse';

/**
 * Checks whether one more component of a type can start on a bicycle now, without replacing another (rule 2 in
 * `docs/store/components.md` §2.3). Exact for a start at the bicycle's current odometer: no period can start above it,
 * so only the periods open now count against `ACTIVE_LIMITS`.
 *
 * @param installed - The bicycle's components (`getInstalledComponents`).
 * @param type - The type of the component that would start.
 * @returns `true` when fewer than `ACTIVE_LIMITS[type]` are in use, or the type has no limit.
 * @example
 * hasRoomForType([], 'chain'); // true
 * hasRoomForType([chainInUse], 'chain'); // false
 */
export function hasRoomForType(installed: readonly BicycleComponent[], type: BicycleComponentType): boolean {
  const limit = ACTIVE_LIMITS[type];

  return limit === null || getComponentsInUse(installed, type).length < limit;
}
