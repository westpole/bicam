import type { ComponentValidationError } from '@store/components/types';

import type { AddComponentErrors, AddComponentFieldDefinition } from '../types';

/**
 * Indexes the store's validation errors by the fields the form shows. Errors for other fields are left out; the form
 * reports those in a general alert.
 *
 * @param errors - Errors of a rejected component.
 * @param fields - The fields the form shows now.
 * @returns The error code per invalid shown field.
 * @example
 * toFormErrors([{ field: 'model', code: 'required' }], DETAIL_FIELDS); // { model: 'required' }
 */
export function toFormErrors(
  errors: readonly ComponentValidationError[],
  fields: readonly AddComponentFieldDefinition[],
): AddComponentErrors {
  return Object.fromEntries(
    fields.flatMap(({ field }) => {
      const error = errors.find((candidate) => candidate.field === field);

      return error ? [[field, error.code]] : [];
    }),
  );
}
