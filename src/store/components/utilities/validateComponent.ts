import { CONTROL_CHARACTER_PATTERN } from '../../common/constants';
import { checkText } from '../../common/utilities/checkText';
import { COMPONENT_LIMITS } from '../constants';
import type { ComponentInput, ComponentValidation, ComponentValidationError } from '../types';
import { isBicycleComponentType } from './isBicycleComponentType';

/**
 * Validates normalized component input against the field limits in `docs/store/components.md` §2.1.
 *
 * @param input - Output of `normalizeComponentInput` (trimmed).
 * @returns The details with a known type when valid; otherwise every failing field, at most one error each, in
 * `BicycleComponent` field order.
 * @example
 * validateComponent({ type: 'chain', model: 'CN-M8100' });
 * // { ok: true, details: { type: 'chain', model: 'CN-M8100' } }
 * validateComponent({ type: 'engine', model: '' });
 * // { ok: false, errors: [{ field: 'type', code: 'invalidOption' }, { field: 'model', code: 'required' }] }
 */
export function validateComponent({ type, model }: ComponentInput): ComponentValidation {
  const errors: ComponentValidationError[] = [];
  const modelCode = checkText(model, COMPONENT_LIMITS.modelMaxLength, CONTROL_CHARACTER_PATTERN);

  if (isBicycleComponentType(type)) {
    if (modelCode === null) {
      return { ok: true, details: { type, model } };
    }
  } else {
    errors.push({ field: 'type', code: type === '' ? 'required' : 'invalidOption' });
  }

  if (modelCode !== null) {
    errors.push({ field: 'model', code: modelCode });
  }

  return { ok: false, errors };
}
