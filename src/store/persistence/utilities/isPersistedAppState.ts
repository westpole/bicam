import { hasComponent } from '../../components/utilities/hasComponent';
import type { PersistedAppState } from '../types';
import { isCollection } from './isCollection';
import { isRecord } from './isRecord';
import { isStoredBicycle } from './isStoredBicycle';
import { isStoredComponent } from './isStoredComponent';

/**
 * Checks whether untrusted data is a usable {@link PersistedAppState}: both collections are consistent, and every
 * bicycle lists stored components only. Extra keys are ignored.
 *
 * @param value - The parsed data.
 * @returns `true` when `value` can be loaded into the store.
 * @example
 * isPersistedAppState({ bicycle: { byId: {}, allIds: [] }, components: { byId: {}, allIds: [] } }); // true
 */
export function isPersistedAppState(value: unknown): value is PersistedAppState {
  if (!isRecord(value)) {
    return false;
  }

  const { bicycle, components } = value;

  return (
    isCollection(bicycle, isStoredBicycle) &&
    isCollection(components, isStoredComponent) &&
    Object.values(bicycle.byId).every((stored) => stored.components.every((id) => hasComponent(components, id)))
  );
}
