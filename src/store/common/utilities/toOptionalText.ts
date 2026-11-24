/**
 * Trims optional text and turns a missing, `null`, or blank value into `null`.
 *
 * @param value - Optional raw text.
 * @returns The trimmed text, or `null` when nothing is left.
 * @example
 * toOptionalText(' M/L '); // 'M/L'
 * toOptionalText('  ');    // null
 */
export function toOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
