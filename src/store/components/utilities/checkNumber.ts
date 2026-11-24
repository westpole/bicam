import type { ComponentErrorCode } from '../types';

/**
 * Checks one number against the common rules, in this order: finite, between 0 and `max`, number of decimals.
 *
 * @param value - The number to check.
 * @param max - Largest allowed value (inclusive).
 * @param decimals - Maximum number of decimals.
 * @returns The first failing rule's code, or `null` when the number is valid.
 * @example
 * checkNumber(412.5, 500_000, 1);  // null
 * checkNumber(-1, 500_000, 1);     // 'outOfRange'
 * checkNumber(412.55, 500_000, 1); // 'invalidFormat'
 */
export function checkNumber(value: number, max: number, decimals: number): ComponentErrorCode | null {
  if (!Number.isFinite(value)) {
    return 'invalidFormat';
  }

  if (value < 0 || value > max) {
    return 'outOfRange';
  }

  // Multiplying by a power of ten instead gives wrong results for some decimals (0.29 * 100 is not 29).
  return Number(value.toFixed(decimals)) === value ? null : 'invalidFormat';
}
