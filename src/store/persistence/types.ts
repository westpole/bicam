import type { PersistStorage, StorageValue } from 'zustand/middleware';

import type { AppStoreState } from '../types';

/** The part of {@link AppStoreState} that is saved: domain data only, never UI state. */
export type PersistedAppState = Pick<AppStoreState, 'bicycle' | 'components'>;

/** `localStorage` adapter for the `persist` middleware that can protect data it could not load. */
export interface AppStorage extends PersistStorage<PersistedAppState, void> {
  /** Reads the stored value synchronously, so the store is loaded before the first render. */
  getItem: (name: string) => StorageValue<PersistedAppState> | null;
  /**
   * Copies the raw stored text to a backup key, unless an identical backup exists, so later writes cannot destroy it.
   * When the copy fails, every later write and removal is blocked until the app reloads.
   */
  quarantine: (name: string) => void;
}
