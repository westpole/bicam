import type { TFunction } from 'i18next';

import { COMPONENT_LIMITS } from '@store/components/constants';
import type { ComponentErrorCode } from '@store/components/types';

/**
 * Translates a store validation error into the text shown under a "new component" field.
 *
 * @param t - The translation function.
 * @param code - Why the store rejected the field. Every code is listed, so a new store code fails the type check here.
 * @returns The translated message.
 * @example
 * getErrorMessage(t, 'tooLong'); // 'Use 60 characters or fewer.'
 */
export function getErrorMessage(t: TFunction, code: ComponentErrorCode): string {
  switch (code) {
    case 'required':
      return t('screens.bicycleDetails.includeComponent.errors.required');
    // Only the model has a maximum length.
    case 'tooLong':
      return t('screens.bicycleDetails.includeComponent.errors.tooLong', { max: COMPONENT_LIMITS.modelMaxLength });
    case 'invalidFormat':
      return t('screens.bicycleDetails.includeComponent.errors.invalidFormat');
    // Not raised for the form's own fields today: the type is chosen from the known ones.
    case 'invalidOption':
    case 'outOfRange':
    case 'notAllowed':
    case 'tooMany':
    case 'notFound':
      return t('screens.bicycleDetails.includeComponent.errors.rejected');
  }
}
