import type { ComponentCollection } from '../../components/types';
import { hasComponent } from '../../components/utilities/hasComponent';
import type { BicycleCollection, BicycleDetails, BicycleId, BicycleValidationError } from '../types';
import { isBicycleNameTaken } from './isBicycleNameTaken';
import { validateBicycle } from './validateBicycle';

/**
 * Validates bicycle details and also checks them against the stored data: the name is not used by another bicycle, and
 * every listed component exists. Used by the store actions before every write.
 *
 * @param collection - The current bicycle collection.
 * @param components - The current component collection.
 * @param details - Normalized bicycle details.
 * @param ignoreId - Id of the bicycle being updated, so it does not clash with its own name.
 * @returns Every failing field, at most one error each, in `Bicycle` field order; `[]` when the write may proceed.
 * @example
 * validateBicycleInCollection(collection, components, { ...details, name: 'roadie' });
 * // [{ field: 'name', code: 'duplicate' }] when 'Roadie' is stored
 */
export function validateBicycleInCollection(
  collection: BicycleCollection,
  components: ComponentCollection,
  details: BicycleDetails,
  ignoreId?: BicycleId,
): BicycleValidationError[] {
  const errors = validateBicycle(details);

  // `name` is the first validated field, so unshift keeps one error per field in field order.
  if (!errors.some(({ field }) => field === 'name') && isBicycleNameTaken(collection, details.name, ignoreId)) {
    errors.unshift({ field: 'name', code: 'duplicate' });
  }

  // `components` is the last validated field, so push keeps one error per field in field order.
  if (
    !errors.some(({ field }) => field === 'components') &&
    details.components.some((componentId) => !hasComponent(components, componentId))
  ) {
    errors.push({ field: 'components', code: 'notFound' });
  }

  return errors;
}
