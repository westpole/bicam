import type { BicycleComponent, BicycleComponentType } from '@store/components/types';
import { BICYCLES } from '@ui/components/screens/Home/__mocks__/bicycles';

import type { AddComponentBicycle } from '../types';

const GRAVEL_ID = BICYCLES[0].id;

/**
 * Builds a component in use on the gravel bicycle since 0 km.
 *
 * @param id - The component id.
 * @param type - The type.
 * @param model - The model.
 * @param label - The label, or `null`.
 * @returns The component.
 */
function inUse(id: string, type: BicycleComponentType, model: string, label: string | null = null): BicycleComponent {
  return {
    id,
    type,
    model,
    label,
    initialDistance: 0,
    limits: { distance: null, stretch: null, lubrication: null, cleaning: null },
    usage: [
      {
        id: `period-${id}`,
        bicycleId: GRAVEL_ID,
        start: { date: null, odometer: 0 },
        end: null,
        replacedPeriodId: null,
      },
    ],
    retired: null,
    history: [],
  };
}

/** The chain in use on the gravel bicycle. */
export const GRAVEL_CHAIN = inUse('component-gravel-chain', 'chain', 'KMC X12', 'A');

/** The two wheels in use on the gravel bicycle, so the type is full. */
export const GRAVEL_WHEELS = [
  inUse('component-gravel-front', 'wheel', 'DT Swiss G 1800', 'front'),
  inUse('component-gravel-rear', 'wheel', 'DT Swiss G 1800', 'rear'),
];

/** Form bicycles: gravel at 1500 km with a chain and two wheels in use, and an empty road bicycle at 300 km. */
export const FORM_BICYCLES: readonly AddComponentBicycle[] = [
  {
    bicycle: { ...BICYCLES[0], odometer: 1500, components: [GRAVEL_CHAIN.id, ...GRAVEL_WHEELS.map(({ id }) => id)] },
    components: [GRAVEL_CHAIN, ...GRAVEL_WHEELS],
  },
  { bicycle: { ...BICYCLES[1], odometer: 300 }, components: [] },
];
