import type { BicycleId } from '../../bicycle/types';
import type { ComponentCollection } from '../types';
import { getLatestBoundary } from './getLatestBoundary';

/**
 * Finds the lowest odometer reading a bicycle may be set to: the latest boundary (`start` or `end` reading) of any usage
 * period on it (rule 6 in `docs/store/components.md` §2.3). Every stored component counts, including spare ones and
 * ones that are now on another bicycle, because their closed periods still name this bicycle.
 *
 * @param components - The component collection.
 * @param bicycleId - The bicycle.
 * @returns The latest boundary in kilometres, or `0` when no period names the bicycle.
 * @example
 * getMinimumOdometer(state.components, bicycleId); // 3100 after a swap at 3100
 */
export function getMinimumOdometer(components: ComponentCollection, bicycleId: BicycleId): number {
  return components.allIds.reduce(
    (minimum, id) => Math.max(minimum, getLatestBoundary(components.byId[id].usage, bicycleId)),
    0,
  );
}
