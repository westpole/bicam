import { isIsoDate } from '../../common/utilities/isIsoDate';
import { COMPONENT_POSITIONS, SUBCOMPONENTS } from '../../components/constants';
import type { ComponentHistoryEntry } from '../../components/types';
import { isRecord } from './isRecord';

/**
 * Checks whether an untrusted value has the shape of a {@link ComponentHistoryEntry}. Checks types, date formats, and
 * known option codes only, not the field limits or the rules per component type.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a history entry.
 * @example
 * isStoredHistoryEntry({ id: 'entry-1' }); // false: the other fields are missing
 */
export function isStoredHistoryEntry(value: unknown): value is ComponentHistoryEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    isIsoDate(value.date) &&
    typeof value.installed === 'string' &&
    isIsoDate(value.installed) &&
    (value.distance === null || typeof value.distance === 'number') &&
    (value.position === null || COMPONENT_POSITIONS.some((position) => position === value.position)) &&
    (value.subcomponent === null ||
      Object.values(SUBCOMPONENTS).some((options) => options.some((option) => option === value.subcomponent))) &&
    (value.lubricated === null || (typeof value.lubricated === 'string' && isIsoDate(value.lubricated))) &&
    (value.stretch === null || typeof value.stretch === 'number')
  );
}
