import { isIsoDate } from '../../common/utilities/isIsoDate';
import { COMPONENT_LIMITS, COMPONENT_POSITIONS, POSITION_TYPES, SUBCOMPONENTS } from '../constants';
import type {
  BicycleComponentType,
  ComponentErrorCode,
  ComponentHistoryField,
  ComponentHistoryValidation,
  NormalizedComponentHistoryInput,
  OptionCheck,
} from '../types';
import { checkNumber } from './checkNumber';

/**
 * Checks a required date: not blank, then a real calendar date.
 *
 * @param date - Already trimmed date.
 * @returns The first failing rule's code, or `null` when the date is valid.
 */
function checkRequiredDate(date: string): ComponentErrorCode | null {
  if (date === '') {
    return 'required';
  }

  return isIsoDate(date) ? null : 'invalidFormat';
}

/**
 * Checks an optional value against the options of the component's type: options exist, then the value is one of them.
 * Matches exactly (case-sensitive).
 *
 * @param value - Already trimmed value, or `null` when there is none.
 * @param options - Allowed values, or `undefined` when the type does not have this field.
 * @returns The matching option, or `null` with the first failing rule's code.
 */
function checkOption<T extends string>(value: string | null, options: readonly T[] | undefined): OptionCheck<T> {
  if (value === null) {
    return { value: null, code: null };
  }

  if (!options) {
    return { value: null, code: 'notAllowed' };
  }

  const option = options.find((candidate) => candidate === value) ?? null;

  return { value: option, code: option === null ? 'invalidOption' : null };
}

/**
 * Validates normalized history input against the field limits in `docs/store/components.md` §2.2 and the rules for the
 * component's type in §3. Dates are not compared with each other or with today. The generated `id` is not validated.
 *
 * @param type - Type of the component the entry belongs to.
 * @param entry - Output of `normalizeComponentHistoryInput` (trimmed, missing values as `null`) or a stored entry.
 * @returns The details with known options when valid; otherwise every failing field, at most one error each, in
 * `ComponentHistoryEntry` field order.
 * @example
 * validateComponentHistoryEntry('chain', {
 *   date: '', installed: '2023-02-30', distance: -1, position: 'rear', subcomponent: null,
 * });
 * // { ok: false, errors: [
 * //   { field: 'date', code: 'required' }, { field: 'installed', code: 'invalidFormat' },
 * //   { field: 'distance', code: 'outOfRange' }, { field: 'position', code: 'notAllowed' },
 * // ] }
 */
export function validateComponentHistoryEntry(
  type: BicycleComponentType,
  entry: NormalizedComponentHistoryInput,
): ComponentHistoryValidation {
  const { distanceMax, distanceMaxDecimals } = COMPONENT_LIMITS;
  const { date, installed, distance } = entry;
  const position = checkOption(entry.position, POSITION_TYPES.includes(type) ? COMPONENT_POSITIONS : undefined);
  const subcomponent = checkOption(entry.subcomponent, SUBCOMPONENTS[type]);
  const checks: Array<[ComponentHistoryField, ComponentErrorCode | null]> = [
    ['date', checkRequiredDate(date)],
    ['installed', checkRequiredDate(installed)],
    ['distance', distance === null ? null : checkNumber(distance, distanceMax, distanceMaxDecimals)],
    ['position', position.code],
    ['subcomponent', subcomponent.code],
  ];
  const errors = checks.flatMap(([field, code]) => (code ? [{ field, code }] : []));

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    details: { date, installed, distance, position: position.value, subcomponent: subcomponent.value },
  };
}
