import type { BicycleComponentType } from '@store/components/types';
import type { ComponentRow } from '@ui/components/ComponentList/types';

/**
 * Finds the types that the bicycle has components of but none in use, for example after the migration found three
 * chains and could not know which one is fitted. The screen asks the rider to choose one.
 *
 * @param rows - The bicycle's components with their usage.
 * @returns The types, in the order their first component appears.
 * @example
 * getTypesWithoutUse([restingChainA, restingChainB, cassetteInUse]); // ['chain']
 */
export function getTypesWithoutUse(rows: readonly ComponentRow[]): BicycleComponentType[] {
  const types = [...new Set(rows.map(({ component }) => component.type))];

  return types.filter((type) => !rows.some(({ component, usage }) => component.type === type && usage.isInUse));
}
