import type { BicycleComponent } from '../../components/types';
import { isBicycleComponentType } from '../../components/utilities/isBicycleComponentType';
import { isRecord } from './isRecord';
import { isStoredHistoryEntry } from './isStoredHistoryEntry';

/**
 * Checks whether an untrusted value has the shape of a {@link BicycleComponent}, including its history. Checks types
 * and known option codes only, not the field limits.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a component.
 * @example
 * isStoredComponent({ id: 'chain-1', type: 'chain', model: 'CN-M8100', history: [] }); // true
 */
export function isStoredComponent(value: unknown): value is BicycleComponent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    isBicycleComponentType(value.type) &&
    typeof value.model === 'string' &&
    Array.isArray(value.history) &&
    value.history.every(isStoredHistoryEntry)
  );
}
