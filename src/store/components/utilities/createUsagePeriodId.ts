import type { UsagePeriodId } from '../types';

/**
 * Generates a new usage period id: a random UUID v4 from the Web Crypto API (available in browsers on secure origins,
 * Electron, and Node).
 *
 * @returns A new, practically unique id such as `'5d0c7e1a-3b9f-4c2d-8e6a-1f2b3c4d5e6f'`.
 * @example
 * const id = createUsagePeriodId();
 */
export function createUsagePeriodId(): UsagePeriodId {
  return crypto.randomUUID();
}
