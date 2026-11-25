import { APP_STORAGE_VERSION } from '../constants';
import type { PersistedAppState } from '../types';
import { isPersistedAppStateV1 } from './isPersistedAppStateV1';
import { migrateFromVersion1 } from './migrateFromVersion1';

/**
 * Upgrades saved data of another version to {@link APP_STORAGE_VERSION}. Only version 1 can be upgraded; data of any
 * other version, including a newer app version, cannot. `mergePersistedState` checks the result.
 *
 * @param persisted - Untrusted data as it was saved.
 * @param version - The version it was saved with.
 * @returns The data in the current shape.
 * @throws Error when there is no migration from `version`, or the version 1 data has an unexpected shape.
 * @example
 * migratePersistedState({ bicycle: { byId: {}, allIds: [] }, components: { byId: {}, allIds: [] } }, 1);
 * migratePersistedState(saved, 3); // throws while the current version is 2
 */
export function migratePersistedState(persisted: unknown, version: number): PersistedAppState {
  if (version !== 1) {
    throw new Error(`Cannot migrate the saved app data from version ${version} to ${APP_STORAGE_VERSION}`);
  }

  if (!isPersistedAppStateV1(persisted)) {
    throw new Error('The saved app data of version 1 has an unexpected shape');
  }

  return migrateFromVersion1(persisted);
}
