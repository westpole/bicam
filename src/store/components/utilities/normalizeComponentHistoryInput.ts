import type { ComponentHistoryDetails, ComponentHistoryInput } from '../types';

/**
 * Turns a missing number into `null` and `-0` into `0`, because `-0` does not survive a JSON round trip.
 *
 * @param value - Optional raw number.
 * @returns The number, or `null` when there is none.
 */
function toOptionalNumber(value: number | null | undefined): number | null {
  // `-0 === 0` is true, so this branch also replaces -0.
  return value === 0 ? 0 : (value ?? null);
}

/**
 * Converts raw history input into the stored entry fields (everything except the generated `id`) without validating
 * them. Picks known fields only and does not mutate `input`.
 *
 * - Trims every string.
 * - A missing or `null` `distance` becomes `null`; `-0` becomes `0`.
 *
 * @param input - Raw history input.
 * @returns New entry details, ready for `validateComponentHistoryEntry`.
 * @example
 * normalizeComponentHistoryInput({ date: ' 2026-04-12 ', installed: '2026-03-01' });
 * // { date: '2026-04-12', installed: '2026-03-01', distance: null }
 */
export function normalizeComponentHistoryInput(input: ComponentHistoryInput): ComponentHistoryDetails {
  return {
    date: input.date.trim(),
    installed: input.installed.trim(),
    distance: toOptionalNumber(input.distance),
  };
}
