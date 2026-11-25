import type { PersistOptions } from 'zustand/middleware';

import type { AppStore } from '../types';
import { APP_STORAGE_KEY, APP_STORAGE_VERSION } from './constants';
import type { PersistedAppState } from './types';
import { createAppStorage } from './utilities/createAppStorage';
import { mergePersistedState } from './utilities/mergePersistedState';
import { migratePersistedState } from './utilities/migratePersistedState';

/**
 * Creates the `persist` options of `useAppStore`: domain data only, in `localStorage`, loaded synchronously while the
 * store is created. Data that cannot be loaded is backed up before the first write can replace it, and the app starts
 * empty. See `docs/store/README.md` §4.
 *
 * @returns The options, with their own storage adapter.
 * @example
 * create<AppStore>()(persist(createState, createPersistOptions()));
 */
export function createPersistOptions(): PersistOptions<AppStore, PersistedAppState, void> {
  const storage = createAppStorage();

  return {
    name: APP_STORAGE_KEY,
    version: APP_STORAGE_VERSION,
    storage,
    partialize: ({ bicycle, components }) => ({ bicycle, components }),
    migrate: migratePersistedState,
    merge: mergePersistedState,
    onRehydrateStorage: () => (_state, error) => {
      if (error !== undefined) {
        console.error('The saved app data could not be loaded', error);
        storage.quarantine(APP_STORAGE_KEY);
      }
    },
  };
}
