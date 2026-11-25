import type { StorageValue } from 'zustand/middleware';

import type { PersistedAppState } from '../types';
import { isRecord } from './isRecord';

/**
 * Parses the stored text and checks its envelope (`state` and `version`). The `persist` middleware would treat a
 * missing `state` as a first run and overwrite the text, so that must fail here. The state itself is checked later, by
 * `mergePersistedState`, because it may have to be migrated first.
 *
 * @param raw - The stored text.
 * @returns The parsed envelope; its `state` is not checked yet.
 * @throws Error when the text is not JSON or not an envelope.
 * @example
 * parseStoredValue('{"state":{},"version":1}'); // { state: {}, version: 1 }
 */
export function parseStoredValue(raw: string): StorageValue<PersistedAppState> {
  const value: unknown = JSON.parse(raw);

  if (!isRecord(value) || !isRecord(value.state) || typeof value.version !== 'number') {
    throw new Error('The saved app data is not a versioned state');
  }

  // Not proven by the checks above: `PersistStorage` requires this type, but `state` is only known to be an object until
  // `mergePersistedState` checks it. Until then, treat its fields as possibly missing.
  return { state: value.state as unknown as PersistedAppState, version: value.version };
}
