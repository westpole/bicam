import type { Bicycle } from '../../bicycle/types';
import type { BicycleComponent, ComponentCollection } from '../types';
import { hasComponent } from './hasComponent';

/**
 * Resolves a bicycle's component ids. Ids that are not stored are skipped.
 *
 * @param collection - The component collection.
 * @param bicycle - The bicycle whose components to list.
 * @returns The stored components in the bicycle's order.
 * @example
 * getInstalledComponents(state.components, state.bicycle.byId[id]);
 */
export function getInstalledComponents(collection: ComponentCollection, bicycle: Bicycle): BicycleComponent[] {
  return bicycle.components.filter((id) => hasComponent(collection, id)).map((id) => collection.byId[id]);
}
