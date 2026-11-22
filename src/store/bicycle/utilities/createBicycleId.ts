import type { BicycleId } from '../types';

/**
 * Generates a new bicycle id: a random UUID v4 from the Web Crypto API (available in browsers on secure origins,
 * Electron, and Node).
 *
 * @returns A new, practically unique id such as `'3b241101-e2bb-4255-8caf-4136c566a962'`.
 * @example
 * const id = createBicycleId();
 */
export function createBicycleId(): BicycleId {
  return crypto.randomUUID();
}
