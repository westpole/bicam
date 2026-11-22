import {
  BICYCLE_LIMITS,
  CONTROL_CHARACTER_PATTERN,
  MULTILINE_FORBIDDEN_PATTERN,
  SIZE_PATTERN,
} from '../constants';
import type { BicycleDetails, BicycleErrorCode, BicycleField, BicycleValidationError } from '../types';
import { isIsoDate } from './isIsoDate';

/**
 * Checks one text value against the common rules: non-empty, maximum length, no forbidden characters.
 *
 * @param value - Already trimmed text.
 * @param maxLength - Maximum allowed length.
 * @param forbidden - Pattern that must not match anywhere in `value`.
 * @returns The first failing rule's code, or `null` when the value is valid.
 */
function checkText(value: string, maxLength: number, forbidden: RegExp): BicycleErrorCode | null {
  if (value.length === 0) {
    return 'required';
  }

  if (value.length > maxLength) {
    return 'tooLong';
  }

  return forbidden.test(value) ? 'invalidFormat' : null;
}

/**
 * Checks the installed component ids: count, each id's text rules, then duplicates.
 *
 * @param components - Already trimmed component ids.
 * @returns The first failing rule's code, or `null` when the list is valid.
 */
function checkComponents(components: readonly string[]): BicycleErrorCode | null {
  if (components.length > BICYCLE_LIMITS.componentsMaxCount) {
    return 'tooMany';
  }

  for (const componentId of components) {
    const code = checkText(componentId, BICYCLE_LIMITS.componentIdMaxLength, CONTROL_CHARACTER_PATTERN);

    if (code) {
      return code;
    }
  }

  return new Set(components).size === components.length ? null : 'duplicate';
}

/**
 * Checks the optional frame size: maximum length and allowed characters.
 *
 * @param size - Already trimmed, non-empty size.
 * @returns The first failing rule's code, or `null` when the size is valid.
 */
function checkSize(size: string): BicycleErrorCode | null {
  if (size.length > BICYCLE_LIMITS.sizeMaxLength) {
    return 'tooLong';
  }

  return SIZE_PATTERN.test(size) ? null : 'invalidFormat';
}

/**
 * Validates normalized bicycle details against the field limits in `docs/store/bicycle.md` §2. Does not check name
 * uniqueness across the store; the store actions do that. The generated `id` is not validated.
 *
 * @param bicycle - Output of `normalizeBicycleInput` (trimmed, blanks as `null`).
 * @returns Every failing field, at most one error each, in `Bicycle` field order; `[]` when valid.
 * @example
 * validateBicycle({ ...details, name: '', size: 'X*L' });
 * // [{ field: 'name', code: 'required' }, { field: 'size', code: 'invalidFormat' }]
 */
export function validateBicycle(bicycle: BicycleDetails): BicycleValidationError[] {
  const checks: Array<[BicycleField, BicycleErrorCode | null]> = [
    ['name', checkText(bicycle.name, BICYCLE_LIMITS.nameMaxLength, CONTROL_CHARACTER_PATTERN)],
    ['company', checkText(bicycle.company, BICYCLE_LIMITS.companyMaxLength, CONTROL_CHARACTER_PATTERN)],
    ['model', checkText(bicycle.model, BICYCLE_LIMITS.modelMaxLength, CONTROL_CHARACTER_PATTERN)],
    ['purchased', bicycle.purchased === null || isIsoDate(bicycle.purchased) ? null : 'invalidFormat'],
    ['size', bicycle.size === null ? null : checkSize(bicycle.size)],
    [
      'frameGeometry',
      bicycle.frameGeometry === null
        ? null
        : checkText(bicycle.frameGeometry, BICYCLE_LIMITS.frameGeometryMaxLength, MULTILINE_FORBIDDEN_PATTERN),
    ],
    ['components', checkComponents(bicycle.components)],
  ];

  return checks.flatMap(([field, code]) => (code ? [{ field, code }] : []));
}
