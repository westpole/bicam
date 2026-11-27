import type { TFunction } from 'i18next';

import type { ComponentErrorCode, StartRange } from '@store/components/types';

import type { UseComponentField } from '../types';

/**
 * Translates a store validation error of a start into the text shown under the use component dialog's field.
 *
 * @param t - The translation function.
 * @param field - The invalid field.
 * @param code - Why the store rejected it.
 * @param range - The readings the store accepts (`getStartRange`), named when the odometer is out of range; `null` when
 * none is accepted.
 * @returns The translated message.
 * @example
 * getUseErrorMessage(t, 'odometer', 'outOfRange', { min: 1500, max: 4500 });
 * // 'The odometer must be from 1,500 to 4,500 km.'
 */
export function getUseErrorMessage(
  t: TFunction,
  field: UseComponentField,
  code: ComponentErrorCode,
  range: StartRange | null,
): string {
  if (field === 'replaces' && code === 'required') {
    return t('screens.bicycleDetails.useComponent.errors.required');
  }

  if (field === 'date' && code === 'invalidFormat') {
    return t('screens.bicycleDetails.useComponent.errors.invalidDate');
  }

  if (field === 'odometer' && code === 'invalidFormat') {
    return t('screens.bicycleDetails.useComponent.errors.invalidNumber');
  }

  if (field === 'odometer' && code === 'outOfRange' && range !== null) {
    return t('screens.bicycleDetails.useComponent.errors.outOfRange', { min: range.min, max: range.max });
  }

  return t('screens.bicycleDetails.useComponent.errors.rejected');
}
