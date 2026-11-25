import type { AppStore } from '../../types';
import { isPersistedAppState } from './isPersistedAppState';

/**
 * Puts loaded data into the store. Takes the persisted keys only, so stored UI state or unknown keys are ignored.
 *
 * @param persisted - Untrusted loaded data, or `undefined` when nothing is stored yet.
 * @param current - The current store.
 * @returns The store with the loaded data.
 * @throws Error when the data is not a usable `PersistedAppState`.
 * @example
 * mergePersistedState(undefined, store); // store
 */
export function mergePersistedState(persisted: unknown, current: AppStore): AppStore {
  if (persisted === undefined) {
    return current;
  }

  if (!isPersistedAppState(persisted)) {
    throw new Error('The saved app data has an unexpected shape');
  }

  return { ...current, bicycle: persisted.bicycle, components: persisted.components };
}
