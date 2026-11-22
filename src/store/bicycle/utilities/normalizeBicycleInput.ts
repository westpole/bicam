import type { Bicycle, BicycleInput } from '../types';

/**
 * Trims optional text and turns a missing, `null`, or blank value into `null`.
 *
 * @param value - Optional raw text.
 * @returns The trimmed text, or `null` when nothing is left.
 */
function toOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

/**
 * Converts raw form input into the stored {@link Bicycle} shape without validating it. Does not mutate `input`.
 *
 * - Trims every string, including each component id.
 * - Optional text (`purchased`, `size`, `frameGeometry`) that is missing, `null`, or blank becomes `null`.
 * - A missing `components` list becomes `[]`.
 *
 * @param input - Raw bicycle input.
 * @returns A new bicycle object, ready for `validateBicycle`.
 * @example
 * normalizeBicycleInput({ id: ' Roadie ', company: 'Canyon', model: 'Ultimate', size: '  ' });
 * // { id: 'Roadie', company: 'Canyon', model: 'Ultimate', purchased: null, size: null, frameGeometry: null, components: [] }
 */
export function normalizeBicycleInput(input: BicycleInput): Bicycle {
  return {
    id: input.id.trim(),
    company: input.company.trim(),
    model: input.model.trim(),
    purchased: toOptionalText(input.purchased),
    size: toOptionalText(input.size),
    frameGeometry: toOptionalText(input.frameGeometry),
    components: (input.components ?? []).map((componentId) => componentId.trim()),
  };
}
