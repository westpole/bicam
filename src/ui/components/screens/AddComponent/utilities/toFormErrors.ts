import type { BicycleComponentValidationError } from '@store/types';

import type { AddComponentErrors, AddComponentFieldDefinition } from '../types';

/**
 * Indexes the store's validation errors by the fields the form shows. Errors for other fields are left out; the form
 * reports those in a general alert.
 *
 * @param errors - Errors of a rejected component, including those of its bicycle and start.
 * @param fields - The fields the form shows now.
 * @returns The error code per invalid shown field.
 * @example
 * toFormErrors([{ field: 'model', code: 'required' }], DETAIL_FIELDS); // { model: 'required' }
 */
export function toFormErrors(
  errors: readonly BicycleComponentValidationError[],
  fields: readonly AddComponentFieldDefinition[],
): AddComponentErrors {
  return Object.fromEntries(
    fields.flatMap(({ field }) => {
      const error = errors.find((candidate) => candidate.field === field);

      return error ? [[field, error.code]] : [];
    }),
  );
}
