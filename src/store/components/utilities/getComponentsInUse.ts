import type { BicycleComponent, BicycleComponentType } from '../types';
import { findOpenPeriod } from './findOpenPeriod';

/**
 * Lists the components of one type that are in use on a bicycle. By rule 1 an open period's bicycle lists its
 * component, so the bicycle's own components are enough.
 *
 * @param installed - The bicycle's components (`getInstalledComponents`).
 * @param type - The type.
 * @returns The components of `type` with an open period, in the bicycle's order: the ones a start can replace.
 * @example
 * getComponentsInUse(getInstalledComponents(state.components, bicycle), 'chain'); // [chainA]
 */
export function getComponentsInUse(
  installed: readonly BicycleComponent[],
  type: BicycleComponentType,
): BicycleComponent[] {
  return installed.filter((component) => component.type === type && findOpenPeriod(component) !== undefined);
}
