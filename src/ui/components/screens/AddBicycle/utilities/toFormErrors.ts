import type { BicycleValidationError } from '@store/bicycle/types';

import { ADD_BICYCLE_FIELDS } from '../constants';
import type { AddBicycleErrors } from '../types';

/**
 * Indexes the store's validation errors by form field. Errors for fields the form does not have are
 * left out; the form reports those in a general alert.
 *
 * @param errors - Errors of a failed bicycle write.
 * @returns The error code per invalid form field.
 * @example
 * toFormErrors([{ field: 'name', code: 'required' }]); // { name: 'required' }
 */
export function toFormErrors(errors: readonly BicycleValidationError[]): AddBicycleErrors {
  return Object.fromEntries(
    ADD_BICYCLE_FIELDS.flatMap(({ field }) => {
      const error = errors.find((candidate) => candidate.field === field);

      return error ? [[field, error.code]] : [];
    }),
  );
}
