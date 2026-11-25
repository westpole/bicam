import type { BicycleValidationError } from '@store/bicycle/types';
import type { BicycleComponentValidationError } from '@store/types';

/**
 * Checks whether a component was rejected because the bicycle has no room for another one.
 *
 * @param errors - Errors of the rejected write.
 * @returns `true` when the bicycle is full.
 * @example
 * isBicycleFull([{ field: 'components', code: 'tooMany' }]); // true
 */
export function isBicycleFull(
  errors: readonly (BicycleValidationError | BicycleComponentValidationError)[],
): boolean {
  return errors.some(({ field, code }) => field === 'components' && code === 'tooMany');
}
