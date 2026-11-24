import type { ComponentId } from '../types';

/**
 * Generates a new component id: a random UUID v4 from the Web Crypto API (available in browsers on secure origins,
 * Electron, and Node).
 *
 * @returns A new, practically unique id such as `'0c8f2f0e-6f0b-4f0e-9a51-5d1b8a4c7a10'`.
 * @example
 * const id = createComponentId();
 */
export function createComponentId(): ComponentId {
  return crypto.randomUUID();
}
