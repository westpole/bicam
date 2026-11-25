import { APP_STORAGE_VERSION } from '../constants';

/**
 * Upgrades saved data of another version to {@link APP_STORAGE_VERSION}. Version 1 is the first one, so there is
 * nothing to upgrade from yet, and data of a newer app version cannot be downgraded. Once there are migrations,
 * `mergePersistedState` checks their result.
 *
 * @param _persisted - Untrusted data as it was saved.
 * @param version - The version it was saved with.
 * @returns Never, until a second version exists.
 * @throws Error when there is no migration from `version`.
 * @example
 * migratePersistedState(saved, 2); // throws while the current version is 1
 */
export function migratePersistedState(_persisted: unknown, version: number): never {
  throw new Error(`Cannot migrate the saved app data from version ${version} to ${APP_STORAGE_VERSION}`);
}
