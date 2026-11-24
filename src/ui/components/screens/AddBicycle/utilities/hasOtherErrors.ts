import type { BicycleValidationError } from '@store/bicycle/types';

import { ADD_BICYCLE_FIELDS } from '../constants';

/**
 * Checks whether the store rejected a field the form does not have, so there is no input to show the error under.
 *
 * @param errors - Errors of a failed bicycle write.
 * @returns `true` when at least one error belongs to no form field.
 * @example
 * hasOtherErrors([{ field: 'components', code: 'notFound' }]); // true
 */
export function hasOtherErrors(errors: readonly BicycleValidationError[]): boolean {
  return errors.some((error) => !ADD_BICYCLE_FIELDS.some(({ field }) => field === error.field));
}
