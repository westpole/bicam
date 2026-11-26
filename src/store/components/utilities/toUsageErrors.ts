import { USAGE_FIELD_ORDER } from '../constants';
import type { ComponentErrorCode, ComponentUsageField, ComponentUsageValidationError } from '../types';

/**
 * Turns the code of each failing usage field into the error list the usage actions return, in `USAGE_FIELD_ORDER`.
 *
 * @param codes - The code per field; a missing or `null` code means the field passed.
 * @returns At most one error per field, in field order; `[]` when every field passed.
 * @example
 * toUsageErrors({ odometer: 'outOfRange', componentId: 'notAllowed' });
 * // [{ field: 'componentId', code: 'notAllowed' }, { field: 'odometer', code: 'outOfRange' }]
 */
export function toUsageErrors(
  codes: Partial<Record<ComponentUsageField, ComponentErrorCode | null>>,
): ComponentUsageValidationError[] {
  return USAGE_FIELD_ORDER.flatMap((field) => {
    const code = codes[field];

    return code ? [{ field, code }] : [];
  });
}
