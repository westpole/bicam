import { LUBRICANTS } from '../../components/constants';
import type { ComponentHistoryEntry } from '../../components/types';
import { isOptionalIsoDate } from './isOptionalIsoDate';
import { isRecord } from './isRecord';
import { isStoredHistoryEntryV1 } from './isStoredHistoryEntryV1';

/**
 * Checks whether an untrusted value has the shape of a {@link ComponentHistoryEntry}: the version 1 fields plus
 * `lubricant` and `cleaned`. Checks types, date formats, and known option codes only, not the field limits or the
 * rules per component type.
 *
 * @param value - The value to check.
 * @returns `true` when `value` can be used as a history entry.
 * @example
 * isStoredHistoryEntry({ id: 'entry-1' }); // false: the other fields are missing
 */
export function isStoredHistoryEntry(value: unknown): value is ComponentHistoryEntry {
  return (
    isRecord(value) &&
    (value.lubricant === null || LUBRICANTS.some((lubricant) => lubricant === value.lubricant)) &&
    isOptionalIsoDate(value.cleaned) &&
    isStoredHistoryEntryV1(value)
  );
}
