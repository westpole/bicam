import type { BicycleCollection, BicycleDetails, BicycleId, BicycleValidationError } from '../types';
import { isBicycleNameTaken } from './isBicycleNameTaken';
import { validateBicycle } from './validateBicycle';

/**
 * Validates bicycle details and also checks that the name is not used by another stored bicycle. Used by the store
 * actions before every write.
 *
 * @param collection - The current bicycle collection.
 * @param details - Normalized bicycle details.
 * @param ignoreId - Id of the bicycle being updated, so it does not clash with its own name.
 * @returns Every failing field, at most one error each, in `Bicycle` field order; `[]` when the write may proceed.
 * @example
 * validateBicycleInCollection(collection, { ...details, name: 'roadie' });
 * // [{ field: 'name', code: 'duplicate' }] when 'Roadie' is stored
 */
export function validateBicycleInCollection(
  collection: BicycleCollection,
  details: BicycleDetails,
  ignoreId?: BicycleId,
): BicycleValidationError[] {
  const errors = validateBicycle(details);

  // `name` is the first validated field, so unshift keeps one error per field in field order.
  if (!errors.some(({ field }) => field === 'name') && isBicycleNameTaken(collection, details.name, ignoreId)) {
    errors.unshift({ field: 'name', code: 'duplicate' });
  }

  return errors;
}
