import { CONTROL_CHARACTER_PATTERN } from '../../common/constants';
import { checkNumber } from '../../common/utilities/checkNumber';
import { checkText } from '../../common/utilities/checkText';
import { CHAIN_CARE_TYPES, CHAIN_LIMIT_KEYS, COMPONENT_LIMIT_KEYS, COMPONENT_LIMITS } from '../constants';
import type {
  BicycleComponentType,
  ComponentErrorCode,
  ComponentField,
  ComponentLimits,
  ComponentValidation,
  NormalizedComponentInput,
} from '../types';
import { isBicycleComponentType } from './isBicycleComponentType';

/**
 * Checks one limit, in this order: the type has it, finite, above 0 and up to its maximum, number of decimals.
 *
 * @param key - Which limit.
 * @param value - The limit, or `null` for none.
 * @param type - The component's type, or `null` when it is unknown; then chain-only limits are not rejected for it.
 * @returns The first failing rule's code, or `null` when the limit is valid.
 */
function checkLimit(
  key: keyof ComponentLimits,
  value: number | null,
  type: BicycleComponentType | null,
): ComponentErrorCode | null {
  if (value === null) {
    return null;
  }

  if (type !== null && CHAIN_LIMIT_KEYS.includes(key) && !CHAIN_CARE_TYPES.includes(type)) {
    return 'notAllowed';
  }

  const isStretch = key === 'stretch';
  const code = isStretch
    ? checkNumber(value, COMPONENT_LIMITS.stretchMax, COMPONENT_LIMITS.stretchMaxDecimals)
    : checkNumber(value, COMPONENT_LIMITS.limitDistanceMax, COMPONENT_LIMITS.distanceMaxDecimals);

  // A limit of 0 would be due at once, so a limit must be above 0.
  return code === null && value === 0 ? 'outOfRange' : code;
}

/**
 * Validates normalized component input against the field limits in `docs/store/components.md` §2.1. Rules that need
 * the stored component (a type or starting distance that can no longer change) are checked by `updateComponent`.
 *
 * @param input - Output of `normalizeComponentInput` (trimmed, complete).
 * @returns The details with a known type when valid; otherwise every failing field, at most one error each, in the
 * order of `COMPONENT_FIELD_ORDER`.
 * @example
 * validateComponent({
 *   type: 'tire', model: '', label: null, initialDistance: -1,
 *   limits: { distance: null, stretch: 1, lubrication: null, cleaning: null },
 * });
 * // { ok: false, errors: [
 * //   { field: 'model', code: 'required' }, { field: 'initialDistance', code: 'outOfRange' },
 * //   { field: 'limits.stretch', code: 'notAllowed' },
 * // ] }
 */
export function validateComponent(input: NormalizedComponentInput): ComponentValidation {
  const { type, model, label, initialDistance, limits } = input;
  const knownType = isBicycleComponentType(type) ? type : null;
  const checks: Array<[ComponentField, ComponentErrorCode | null]> = [
    ['type', knownType !== null ? null : type === '' ? 'required' : 'invalidOption'],
    ['model', checkText(model, COMPONENT_LIMITS.modelMaxLength, CONTROL_CHARACTER_PATTERN)],
    ['label', label === null ? null : checkText(label, COMPONENT_LIMITS.labelMaxLength, CONTROL_CHARACTER_PATTERN)],
    [
      'initialDistance',
      checkNumber(initialDistance, COMPONENT_LIMITS.initialDistanceMax, COMPONENT_LIMITS.distanceMaxDecimals),
    ],
    ...COMPONENT_LIMIT_KEYS.map((key): [ComponentField, ComponentErrorCode | null] => [
      `limits.${key}`,
      checkLimit(key, limits[key], knownType),
    ]),
  ];
  const errors = checks.flatMap(([field, code]) => (code ? [{ field, code }] : []));

  if (knownType === null || errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, details: { type: knownType, model, label, initialDistance, limits: { ...limits } } };
}
