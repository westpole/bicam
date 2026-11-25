import type { BicycleComponentValidationError } from '@store/types';

import { NEW_COMPONENT_FIELDS } from '../constants';
import type { NewComponentErrors } from '../types';

/**
 * Indexes the store's validation errors by field of the "new component" form. Errors for other fields are left out;
 * the form reports those in an alert.
 *
 * @param errors - Errors of a rejected new component.
 * @returns The error code per invalid form field.
 * @example
 * toFormErrors([{ field: 'model', code: 'required' }]); // { model: 'required' }
 */
export function toFormErrors(errors: readonly BicycleComponentValidationError[]): NewComponentErrors {
  return Object.fromEntries(
    NEW_COMPONENT_FIELDS.flatMap((field) => {
      const error = errors.find((candidate) => candidate.field === field);

      return error ? [[field, error.code]] : [];
    }),
  );
}
