import type { StorageValue } from 'zustand/middleware';

import type { AppStorage, PersistedAppState } from '../types';
import { hasBackup } from './hasBackup';
import { parseStoredValue } from './parseStoredValue';

/**
 * Creates the `localStorage` adapter for the `persist` middleware.
 *
 * - Writes and removals never throw, so a full or blocked storage cannot break a store action; the failure is logged.
 * - A write is skipped when the persisted slices have not changed since the last attempt, because `persist` writes on
 *   every update, including UI-only ones. A failed write is therefore tried again with the next data change. Slices are
 *   compared by reference: actions replace them, never mutate them.
 *
 * @returns The adapter.
 * @example
 * const storage = createAppStorage();
 */
export function createAppStorage(): AppStorage {
  // The value last read, or last written whether or not that worked; `null` before the first one.
  let latest: StorageValue<PersistedAppState> | null = null;
  let isWriteBlocked = false;

  return {
    getItem: (name) => {
      const raw = localStorage.getItem(name);

      latest = raw === null ? null : parseStoredValue(raw);

      return latest;
    },
    setItem: (name, value) => {
      const isUnchanged =
        latest !== null &&
        latest.version === value.version &&
        latest.state.bicycle === value.state.bicycle &&
        latest.state.components === value.state.components;

      if (isWriteBlocked || isUnchanged) {
        return;
      }

      latest = value;

      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.error('The app data could not be saved', error);
      }
    },
    removeItem: (name) => {
      if (isWriteBlocked) {
        return;
      }

      latest = null;

      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.error('The saved app data could not be removed', error);
      }
    },
    quarantine: (name) => {
      const backupPrefix = `${name}:backup:`;

      try {
        const raw = localStorage.getItem(name);

        if (raw !== null && !hasBackup(backupPrefix, raw)) {
          localStorage.setItem(`${backupPrefix}${Date.now()}`, raw);
        }
      } catch (error) {
        isWriteBlocked = true;
        console.error('The unreadable app data could not be backed up; changes will not be saved', error);
      }
    },
  };
}
