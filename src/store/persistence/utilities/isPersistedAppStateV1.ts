import type { PersistedAppStateV1 } from '../types';
import { isCollection } from './isCollection';
import { isRecord } from './isRecord';
import { isStoredBicycleV1 } from './isStoredBicycleV1';
import { isStoredComponentV1 } from './isStoredComponentV1';

/**
 * Checks whether untrusted data saved as version 1 can be migrated: both collections are consistent, and every bicycle
 * lists stored components only. Extra keys are ignored.
 *
 * @param value - The parsed data.
 * @returns `true` when `value` is usable version 1 data.
 * @example
 * isPersistedAppStateV1({ bicycle: { byId: {}, allIds: [] }, components: { byId: {}, allIds: [] } }); // true
 */
export function isPersistedAppStateV1(value: unknown): value is PersistedAppStateV1 {
  if (!isRecord(value)) {
    return false;
  }

  const { bicycle, components } = value;

  return (
    isCollection(bicycle, isStoredBicycleV1) &&
    isCollection(components, isStoredComponentV1) &&
    Object.values(bicycle.byId).every((stored) =>
      stored.components.every((id) => Object.prototype.hasOwnProperty.call(components.byId, id)),
    )
  );
}
