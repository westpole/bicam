import { DECIMAL_PATTERN } from '../constants';

/**
 * Reads a number typed into a form field. Text that is not a plain decimal number becomes `NaN`, so the store rejects
 * it as `invalidFormat` instead of saving it as empty.
 *
 * @param text - The field's text.
 * @returns `null` for an empty field, the number, or `NaN` for anything else.
 * @example
 * parseNumber(' 412.5 '); // 412.5
 * parseNumber('');        // null
 * parseNumber('1,5');     // NaN
 */
export function parseNumber(text: string): number | null {
  const trimmed = text.trim();

  if (trimmed === '') {
    return null;
  }

  return DECIMAL_PATTERN.test(trimmed) ? Number(trimmed) : NaN;
}
