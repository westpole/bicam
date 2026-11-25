import { CHAIN_CARE_TYPES } from '@store/components/constants';

/**
 * Checks whether the chosen type has the chain-only limits (stretch, top-up, and cleaning), so the form shows them.
 *
 * @param type - The type select's value; `''` when nothing is chosen.
 * @returns `true` for the types in `CHAIN_CARE_TYPES`.
 * @example
 * hasChainLimits('chain'); // true
 * hasChainLimits('tire');  // false
 */
export function hasChainLimits(type: string): boolean {
  return CHAIN_CARE_TYPES.some((chainType) => chainType === type);
}
