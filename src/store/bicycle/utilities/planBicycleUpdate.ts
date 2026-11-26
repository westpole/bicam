import { definedChanges } from '../../common/utilities/definedChanges';
import type { ComponentCollection } from '../../components/types';
import type { Bicycle, BicycleCollection, BicycleId, BicycleUpdate, BicycleUpdatePlan } from '../types';
import { hasBicycle } from './hasBicycle';
import { normalizeBicycleInput } from './normalizeBicycleInput';
import { validateBicycleInCollection } from './validateBicycleInCollection';

/**
 * Validates and prepares `updateBicycle` without writing. Merges `changes` into the stored bicycle, then normalizes
 * and validates the result; the odometer fields are always kept.
 *
 * @param collection - The current bicycle collection.
 * @param components - The current component collection (read only).
 * @param id - The bicycle to update.
 * @param changes - The changes; omitted or `undefined` keys are unchanged.
 * @returns The updated bicycle and the next collection, or every failing field (only `notFound` on `id` for an
 *   unknown id).
 * @example
 * const plan = planBicycleUpdate(state.bicycle, state.components, id, { name: 'Roadie' });
 * if (plan.ok) set({ bicycle: plan.collection });
 */
export function planBicycleUpdate(
  collection: BicycleCollection,
  components: ComponentCollection,
  id: BicycleId,
  changes: BicycleUpdate,
): BicycleUpdatePlan {
  if (!hasBicycle(collection, id)) {
    return { ok: false, errors: [{ field: 'id', code: 'notFound' }] };
  }

  const stored = collection.byId[id];
  // normalizeBicycleInput picks known fields only, so `id` and odometer keys in `changes` are ignored.
  const details = normalizeBicycleInput({ ...stored, ...definedChanges(changes) });
  const errors = validateBicycleInCollection(collection, components, details, id);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const bicycle: Bicycle = { id, ...details, odometer: stored.odometer, odometerDate: stored.odometerDate };

  return { ok: true, bicycle, collection: { byId: { ...collection.byId, [id]: bicycle }, allIds: collection.allIds } };
}
