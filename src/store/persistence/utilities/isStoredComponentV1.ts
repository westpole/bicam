import { isBicycleComponentType } from '../../components/utilities/isBicycleComponentType';
import type { BicycleComponentV1 } from '../types';
import { isRecord } from './isRecord';
import { isStoredHistoryEntryV1 } from './isStoredHistoryEntryV1';

/**
 * Checks whether an untrusted value has the shape of a version 1 component, including its history. Checks types and
 * known option codes only, not the field limits. Extra keys are ignored.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a version 1 component.
 * @example
 * isStoredComponentV1({ id: 'chain-1', type: 'chain', model: 'CN-M8100', history: [] }); // true
 */
export function isStoredComponentV1(value: unknown): value is BicycleComponentV1 {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    isBicycleComponentType(value.type) &&
    typeof value.model === 'string' &&
    Array.isArray(value.history) &&
    value.history.every(isStoredHistoryEntryV1)
  );
}
