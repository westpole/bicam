import type { BicycleComponent } from '@store/components/types';
import { SPARE_COMPONENTS } from '@ui/components/ComponentList/__mocks__/components';

import type { SpareComponent } from '../types';

/** {@link SPARE_COMPONENTS} with their distances: a used chain and a new saddle. */
export const SPARES: readonly SpareComponent[] = [
  { component: SPARE_COMPONENTS[0], distance: 412.5 },
  { component: SPARE_COMPONENTS[1], distance: 0 },
];

/**
 * Builds one of three identical chains, told apart only by label and distance.
 *
 * @param label - The chain's label.
 * @param distance - Its distance in kilometres.
 * @returns The spare.
 */
function identicalChain(label: string, distance: number): SpareComponent {
  const component: BicycleComponent = { ...SPARE_COMPONENTS[0], id: `component-chain-${label}`, label };

  return { component, distance };
}

/** Three identical chains, as a rider who rotates chains keeps them. */
export const IDENTICAL_CHAIN_SPARES: readonly SpareComponent[] = [
  identicalChain('A', 1500),
  identicalChain('B', 1600),
  identicalChain('C', 0),
];
