import type { ComponentHistoryInput, ComponentHistoryResult } from '@store/components/types';
import { LUBRICANTS } from '@store/components/constants';
import { normalizeComponentHistoryInput } from '@store/components/utilities/normalizeComponentHistoryInput';

/**
 * Stands in for a store that accepts every care entry: the input, normalized, as the stored entry.
 *
 * @param input - The dialog's input.
 * @returns A successful result.
 * @example
 * const onLogCare = vi.fn((_id, input) => acceptCare(input));
 */
export function acceptCare(input: ComponentHistoryInput): ComponentHistoryResult {
  const details = normalizeComponentHistoryInput(input);

  return {
    ok: true,
    entry: {
      ...details,
      id: 'entry-1',
      position: null,
      subcomponent: null,
      lubricant: LUBRICANTS.find((lubricant) => lubricant === details.lubricant) ?? null,
    },
  };
}
