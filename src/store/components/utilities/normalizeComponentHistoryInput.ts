import { toOptionalText } from '../../common/utilities/toOptionalText';
import type { ComponentHistoryInput, NormalizedComponentHistoryInput } from '../types';

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
 * Converts raw history input into the entry fields (everything except the generated `id`) without validating them.
 * Picks known fields only and does not mutate `input`.
 *
 * - Trims every string.
 * - A missing, `null`, or blank `position`, `subcomponent`, or `lubricated` becomes `null`.
 * - A missing or `null` `distance` or `stretch` becomes `null`; `-0` becomes `0`.
 *
 * @param input - Raw history input.
 * @returns New history input, ready for `validateComponentHistoryEntry`.
 * @example
 * normalizeComponentHistoryInput({ date: ' 2026-04-12 ', installed: '2026-03-01', position: 'rear' });
 * // { date: '2026-04-12', installed: '2026-03-01', distance: null, position: 'rear', subcomponent: null,
 * //   lubricated: null, stretch: null }
 */
export function normalizeComponentHistoryInput(input: ComponentHistoryInput): NormalizedComponentHistoryInput {
  return {
    date: input.date.trim(),
    installed: input.installed.trim(),
    distance: toOptionalNumber(input.distance),
    position: toOptionalText(input.position),
    subcomponent: toOptionalText(input.subcomponent),
    lubricated: toOptionalText(input.lubricated),
    stretch: toOptionalNumber(input.stretch),
  };
}
