/**
 * Checks whether an untrusted value is a plain key/value object.
 *
 * @param value - The value to check.
 * @returns `true` for any object except arrays and `null`.
 * @example
 * isRecord({}); // true
 * isRecord([]); // false
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
