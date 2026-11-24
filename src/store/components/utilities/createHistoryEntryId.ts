import type { HistoryEntryId } from '../types';

/**
 * Generates a new history entry id: a random UUID v4 from the Web Crypto API (available in browsers on secure origins,
 * Electron, and Node).
 *
 * @returns A new, practically unique id such as `'7a1f3c52-2d8e-4b6f-8c1d-9e0f5a6b7c8d'`.
 * @example
 * const id = createHistoryEntryId();
 */
export function createHistoryEntryId(): HistoryEntryId {
  return crypto.randomUUID();
}
