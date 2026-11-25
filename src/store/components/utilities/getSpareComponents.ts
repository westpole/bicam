import type { BicycleCollection } from '../../bicycle/types';
import { getInstalledComponentIds } from '../../bicycle/utilities/getInstalledComponentIds';
import type { BicycleComponent, ComponentCollection } from '../types';

/**
 * Lists the stored components that no bicycle has installed.
 *
 * @param collection - The component collection.
 * @param bicycles - The bicycle collection.
 * @returns The spare components in display order (`allIds`).
 * @example
 * getSpareComponents(state.components, state.bicycle);
 */
export function getSpareComponents(collection: ComponentCollection, bicycles: BicycleCollection): BicycleComponent[] {
  const installed = getInstalledComponentIds(bicycles);

  return collection.allIds.filter((id) => !installed.has(id)).map((id) => collection.byId[id]);
}
