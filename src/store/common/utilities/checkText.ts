import type { TextErrorCode } from '../types';

/**
 * Checks one text value against the common rules: non-empty, maximum length, no forbidden characters.
 *
 * @param value - Already trimmed text.
 * @param maxLength - Maximum allowed length.
 * @param forbidden - Pattern that must not match anywhere in `value`.
 * @returns The first failing rule's code, or `null` when the value is valid.
 * @example
 * checkText('', 60, CONTROL_CHARACTER_PATTERN);      // 'required'
 * checkText('Grizl', 60, CONTROL_CHARACTER_PATTERN); // null
 */
export function checkText(value: string, maxLength: number, forbidden: RegExp): TextErrorCode | null {
  if (value.length === 0) {
    return 'required';
  }

  if (value.length > maxLength) {
    return 'tooLong';
  }

  return forbidden.test(value) ? 'invalidFormat' : null;
}
