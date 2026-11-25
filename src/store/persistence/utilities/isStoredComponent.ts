import { isIsoDate } from '../../common/utilities/isIsoDate';
import type { BicycleComponent, ComponentLimits, ComponentRetirement } from '../../components/types';
import { isBicycleComponentType } from '../../components/utilities/isBicycleComponentType';
import { isRecord } from './isRecord';
import { isStoredHistoryEntry } from './isStoredHistoryEntry';
import { isStoredUsagePeriod } from './isStoredUsagePeriod';

/**
 * Checks whether an untrusted value has the shape of {@link ComponentLimits}. Values are not compared with the field
 * limits, and chain-only limits are accepted on any type.
 *
 * @param value - The value to check.
 * @returns `true` when every limit is a number or `null`.
 */
function isStoredLimits(value: unknown): value is ComponentLimits {
  return (
    isRecord(value) &&
    [value.distance, value.stretch, value.lubrication, value.cleaning].every(
      (limit) => limit === null || typeof limit === 'number',
    )
  );
}

/**
 * Checks whether an untrusted value has the shape of a {@link ComponentRetirement}. The bicycle is not looked up,
 * because it may have been removed.
 *
 * @param value - The value to check.
 * @returns `true` when `date` is a real date and `bicycleId` is a string.
 */
function isStoredRetirement(value: unknown): value is ComponentRetirement {
  return (
    isRecord(value) && typeof value.date === 'string' && isIsoDate(value.date) && typeof value.bicycleId === 'string'
  );
}

/**
 * Checks whether an untrusted value has the shape of a {@link BicycleComponent}, including its usage and history.
 * Checks types, date formats, and known option codes only, not the field limits, the number of periods, or how they
 * relate to each other. `isPersistedAppState` checks the open period against the bicycles.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a component.
 * @example
 * isStoredComponent({
 *   id: 'chain-1', type: 'chain', model: 'CN-M8100', label: null, initialDistance: 0,
 *   limits: { distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 }, usage: [], retired: null, history: [],
 * }); // true
 * isStoredComponent({ id: 'chain-1', type: 'chain', model: 'CN-M8100', history: [] }); // false: version 1 shape
 */
export function isStoredComponent(value: unknown): value is BicycleComponent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    isBicycleComponentType(value.type) &&
    typeof value.model === 'string' &&
    (value.label === null || typeof value.label === 'string') &&
    typeof value.initialDistance === 'number' &&
    isStoredLimits(value.limits) &&
    Array.isArray(value.usage) &&
    value.usage.every(isStoredUsagePeriod) &&
    (value.retired === null || isStoredRetirement(value.retired)) &&
    Array.isArray(value.history) &&
    value.history.every(isStoredHistoryEntry)
  );
}
