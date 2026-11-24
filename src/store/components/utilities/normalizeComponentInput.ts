import type { ComponentInput } from '../types';

/**
 * Trims raw component input without validating it. Picks known fields only, so an `id`, a `history`, or any other
 * extra key is dropped, and does not mutate `input`.
 *
 * @param input - Raw component input.
 * @returns New component input, ready for `validateComponent`.
 * @example
 * normalizeComponentInput({ type: 'chain', model: '  Shimano CN-M8100 ' });
 * // { type: 'chain', model: 'Shimano CN-M8100' }
 */
export function normalizeComponentInput(input: ComponentInput): ComponentInput {
  return {
    type: input.type.trim(),
    model: input.model.trim(),
  };
}
