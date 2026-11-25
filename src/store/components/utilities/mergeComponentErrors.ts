import { COMPONENT_FIELD_ORDER } from '../constants';
import type { ComponentValidationError } from '../types';

/**
 * Combines the update conflicts with the validation errors: at most one error per field, the conflict first, because
 * `notAllowed` is checked before a field's own rules. The result is in `COMPONENT_FIELD_ORDER`.
 *
 * @param conflicts - Errors from `findUpdateConflicts`.
 * @param errors - Errors from `validateComponent`.
 * @returns The merged errors.
 * @example
 * mergeComponentErrors(
 *   [{ field: 'initialDistance', code: 'notAllowed' }],
 *   [{ field: 'model', code: 'required' }, { field: 'initialDistance', code: 'outOfRange' }],
 * );
 * // [{ field: 'model', code: 'required' }, { field: 'initialDistance', code: 'notAllowed' }]
 */
export function mergeComponentErrors(
  conflicts: readonly ComponentValidationError[],
  errors: readonly ComponentValidationError[],
): ComponentValidationError[] {
  const others = errors.filter(({ field }) => !conflicts.some((conflict) => conflict.field === field));

  return [...conflicts, ...others].sort(
    (a, b) => COMPONENT_FIELD_ORDER.indexOf(a.field) - COMPONENT_FIELD_ORDER.indexOf(b.field),
  );
}
