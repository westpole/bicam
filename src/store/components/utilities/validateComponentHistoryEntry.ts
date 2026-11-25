import { isIsoDate } from '../../common/utilities/isIsoDate';
import {
  CHAIN_CARE_TYPES,
  COMPONENT_LIMITS,
  COMPONENT_POSITIONS,
  LUBRICANTS,
  POSITION_TYPES,
  SUBCOMPONENTS,
} from '../constants';
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
 * Checks an optional `lubricated` date: the type has it, then a real calendar date.
 *
 * @param lubricated - Already trimmed date, or `null` when there is none.
 * @param isAllowed - Whether the component's type has this field.
 * @returns The first failing rule's code, or `null` when the value is valid.
 */
function checkLubricated(lubricated: string | null, isAllowed: boolean): ComponentErrorCode | null {
  if (lubricated === null) {
    return null;
  }

  if (!isAllowed) {
    return 'notAllowed';
  }

  return isIsoDate(lubricated) ? null : 'invalidFormat';
}

/**
 * Checks an optional `stretch` percentage: the type has it, then the number rules of `checkNumber`.
 *
 * @param stretch - The percentage, or `null` when there is none.
 * @param isAllowed - Whether the component's type has this field.
 * @returns The first failing rule's code, or `null` when the value is valid.
 */
function checkStretch(stretch: number | null, isAllowed: boolean): ComponentErrorCode | null {
  if (stretch === null) {
    return null;
  }

  return isAllowed
    ? checkNumber(stretch, COMPONENT_LIMITS.stretchMax, COMPONENT_LIMITS.stretchMaxDecimals)
    : 'notAllowed';
}

/**
 * Checks an optional `cleaned` date: the type has it, then a real calendar date, then the same day as a valid
 * `lubricated`. A missing `lubricated` is reported on that field instead (see `validateComponentHistoryEntry`).
 *
 * @param cleaned - Already trimmed date, or `null` when there is none.
 * @param lubricated - The entry's `lubricated` date, or `null` when it is missing or invalid.
 * @param isAllowed - Whether the component's type has this field.
 * @returns The first failing rule's code, or `null` when the value is valid.
 */
function checkCleaned(
  cleaned: string | null,
  lubricated: string | null,
  isAllowed: boolean,
): ComponentErrorCode | null {
  if (cleaned === null) {
    return null;
  }

  if (!isAllowed) {
    return 'notAllowed';
  }

  if (!isIsoDate(cleaned)) {
    return 'invalidFormat';
  }

  return lubricated === null || lubricated === cleaned ? null : 'notAllowed';
}

/**
 * Validates normalized history input against the field limits in `docs/store/components.md` §2.2 and the rules for the
 * component's type in §3. Dates are not compared with today; only `cleaned` is compared with `lubricated`. The
 * generated `id` is not validated.
 *
 * - `lubricant` needs `lubricated`, otherwise it is `notAllowed`. `lubricated` without `lubricant` is valid (unknown).
 * - A valid `cleaned` without `lubricated` makes `lubricated` `required`, because a cleaned chain is relubricated.
 *
 * @param type - Type of the component the entry belongs to.
 * @param entry - Output of `normalizeComponentHistoryInput` (trimmed, missing values as `null`) or a stored entry.
 * @returns The details with known options when valid; otherwise every failing field, at most one error each, in
 * `ComponentHistoryEntry` field order.
 * @example
 * validateComponentHistoryEntry('chain', {
 *   date: '', installed: '2023-02-30', distance: -1, position: 'rear', subcomponent: null,
 *   lubricated: null, stretch: 9, lubricant: 'wax', cleaned: '2026-04-12',
 * });
 * // { ok: false, errors: [
 * //   { field: 'date', code: 'required' }, { field: 'installed', code: 'invalidFormat' },
 * //   { field: 'distance', code: 'outOfRange' }, { field: 'position', code: 'notAllowed' },
 * //   { field: 'lubricated', code: 'required' }, { field: 'stretch', code: 'outOfRange' },
 * //   { field: 'lubricant', code: 'notAllowed' },
 * // ] }
 */
export function validateComponentHistoryEntry(
  type: BicycleComponentType,
  entry: NormalizedComponentHistoryInput,
): ComponentHistoryValidation {
  const { distanceMax, distanceMaxDecimals } = COMPONENT_LIMITS;
  const { date, installed, distance, lubricated, stretch, cleaned } = entry;
  const hasChainCare = CHAIN_CARE_TYPES.includes(type);
  const position = checkOption(entry.position, POSITION_TYPES.includes(type) ? COMPONENT_POSITIONS : undefined);
  const subcomponent = checkOption(entry.subcomponent, SUBCOMPONENTS[type]);
  const lubricant = checkOption(entry.lubricant, hasChainCare ? LUBRICANTS : undefined);
  const lubricatedCode = checkLubricated(lubricated, hasChainCare);
  const cleanedCode = checkCleaned(cleaned, lubricatedCode === null ? lubricated : null, hasChainCare);
  const needsLubricated = lubricated === null && cleaned !== null && cleanedCode === null;
  const lubricantCode = lubricant.code ?? (lubricant.value !== null && lubricated === null ? 'notAllowed' : null);
  const checks: Array<[ComponentHistoryField, ComponentErrorCode | null]> = [
    ['date', checkRequiredDate(date)],
    ['installed', checkRequiredDate(installed)],
    ['distance', distance === null ? null : checkNumber(distance, distanceMax, distanceMaxDecimals)],
    ['position', position.code],
    ['subcomponent', subcomponent.code],
    ['lubricated', needsLubricated ? 'required' : lubricatedCode],
    ['stretch', checkStretch(stretch, hasChainCare)],
    ['lubricant', lubricantCode],
    ['cleaned', cleanedCode],
  ];
  const errors = checks.flatMap(([field, code]) => (code ? [{ field, code }] : []));

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    details: {
      date,
      installed,
      distance,
      position: position.value,
      subcomponent: subcomponent.value,
      lubricated,
      stretch,
      lubricant: lubricant.value,
      cleaned,
    },
  };
}
