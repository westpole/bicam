import type { PersistStorage, StorageValue } from 'zustand/middleware';

import type { BicycleComponentType, ComponentPosition, Subcomponent } from '../components/types';
import type { AppStoreState } from '../types';

/** The part of {@link AppStoreState} that is saved: domain data only, never UI state. */
export type PersistedAppState = Pick<AppStoreState, 'bicycle' | 'components'>;

/**
 * A bicycle as saved in version 1. Kept as written then, not derived from today's types, so a later change to
 * `Bicycle` cannot change what the migration accepts.
 */
export interface BicycleV1 {
  id: string;
  name: string;
  company: string;
  model: string;
  purchased: string | null;
  size: string | null;
  frameGeometry: string | null;
  components: string[];
}

/** A component history entry as saved in version 1. Options are checked against today's lists. */
export interface ComponentHistoryEntryV1 {
  id: string;
  date: string;
  installed: string;
  distance: number | null;
  position: ComponentPosition | null;
  subcomponent: Subcomponent | null;
  lubricated: string | null;
  stretch: number | null;
}

/** A component as saved in version 1. */
export interface BicycleComponentV1 {
  id: string;
  type: BicycleComponentType;
  model: string;
  history: ComponentHistoryEntryV1[];
}

/** Saved data of version 1, the shape `migratePersistedState` upgrades from. */
export interface PersistedAppStateV1 {
  bicycle: { byId: Record<string, BicycleV1>; allIds: string[] };
  components: { byId: Record<string, BicycleComponentV1>; allIds: string[] };
}

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
