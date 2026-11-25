import { COMPONENT_TYPES } from '@store/components/constants';
import type { BicycleComponent, BicycleComponentType, ComponentCollection } from '@store/components/types';
import { getDefaultLimits } from '@store/components/utilities/getDefaultLimits';

/**
 * Builds a valid component fixture without label, usage, or history, with the default limits of its type.
 *
 * @param id - The component id (fixtures use readable ids instead of UUIDs).
 * @param type - The component type.
 * @param model - The component model.
 * @returns The component.
 */
function makeComponent(id: string, type: BicycleComponentType, model: string): BicycleComponent {
  return {
    id,
    type,
    model,
    label: null,
    initialDistance: 0,
    limits: getDefaultLimits(type),
    usage: [],
    retired: null,
    history: [],
  };
}

/** Three components in display order, for stories and tests. */
export const COMPONENTS: readonly BicycleComponent[] = [
  makeComponent('component-chain', 'chain', 'Shimano CN-M8100'),
  makeComponent('component-wheel', 'wheel', 'DT Swiss G 1800'),
  makeComponent('component-tape', 'barTape', 'Supacaz Super Sticky Kush'),
];

/** Two components that are meant to be on no bicycle. */
export const SPARE_COMPONENTS: readonly BicycleComponent[] = [
  makeComponent('component-spare-chain', 'chain', 'KMC X12'),
  makeComponent('component-spare-saddle', 'saddle', 'Fizik Argo'),
];

/** A component with a 60-character model without spaces, the longest the store allows. */
export const LONG_MODEL_COMPONENT: BicycleComponent = makeComponent(
  'component-long',
  'bottomBracket',
  'Model'.repeat(12),
);

/** One component of every type: more than fit on a phone screen. */
export const ALL_TYPE_COMPONENTS: readonly BicycleComponent[] = COMPONENT_TYPES.map((type) =>
  makeComponent(`component-${type}`, type, `Model of ${type}`),
);

/**
 * Turns a list of components into the store's normalized collection, keeping the list order.
 *
 * @param components - Components in display order.
 * @returns The `components` slice value.
 */
export function toComponentCollection(components: readonly BicycleComponent[]): ComponentCollection {
  return {
    byId: Object.fromEntries(components.map((component) => [component.id, component])),
    allIds: components.map(({ id }) => id),
  };
}
