import type { BicycleComponent, ComponentUsagePeriod } from '../types';

/**
 * Finds the component's open usage period. By rule 1 there is at most one, and its bicycle lists the component.
 *
 * @param component - A stored component.
 * @returns The open period, or `undefined` when the component is not in use.
 * @example
 * const inUse = findOpenPeriod(component) !== undefined;
 */
export function findOpenPeriod(component: BicycleComponent): ComponentUsagePeriod | undefined {
  return component.usage.find(({ end }) => end === null);
}
