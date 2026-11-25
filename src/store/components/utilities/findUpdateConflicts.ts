import type { BicycleComponent, ComponentValidationError, NormalizedComponentInput } from '../types';
import { isBicycleComponentType } from './isBicycleComponentType';
import { isHistoryValidForType } from './isHistoryValidForType';

/**
 * Checks the update rules that depend on the stored component (`docs/store/components.md` §4):
 *
 * - A new type is `notAllowed` once the component has usage periods, because its distance would move to another kind
 *   of part, or when a stored history entry is not valid for it.
 * - A new `initialDistance` is `notAllowed` once a whole-component history entry has a distance, because that entry
 *   already includes the starting distance.
 *
 * An unknown type is left to `validateComponent`, which reports it as `invalidOption`.
 *
 * @param stored - The component before the update.
 * @param input - The normalized, merged update.
 * @returns The conflicts, in field order; `[]` when there are none.
 * @example
 * findUpdateConflicts(chainWithUsage, { ...chainWithUsage, type: 'cassette' });
 * // [{ field: 'type', code: 'notAllowed' }]
 */
export function findUpdateConflicts(
  stored: BicycleComponent,
  input: NormalizedComponentInput,
): ComponentValidationError[] {
  const conflicts: ComponentValidationError[] = [];
  if (
    input.type !== stored.type &&
    isBicycleComponentType(input.type) &&
    (stored.usage.length > 0 || !isHistoryValidForType(input.type, stored.history))
  ) {
    conflicts.push({ field: 'type', code: 'notAllowed' });
  }

  const hasWholeDistance = stored.history.some(
    ({ subcomponent, distance }) => subcomponent === null && distance !== null,
  );

  if (input.initialDistance !== stored.initialDistance && hasWholeDistance) {
    conflicts.push({ field: 'initialDistance', code: 'notAllowed' });
  }

  return conflicts;
}
