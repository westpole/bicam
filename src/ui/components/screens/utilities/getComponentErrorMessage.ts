import type { TFunction } from 'i18next';

import { COMPONENT_LIMITS } from '@store/components/constants';
import type { ComponentErrorCode, ComponentField } from '@store/components/types';

import { NUMBER_EXAMPLES } from './constants';

/**
 * Translates a store validation error of a component field into the text shown under that field. Shared by every form
 * that writes components, so they explain the same error in the same words.
 *
 * @param t - The translation function.
 * @param field - The invalid field.
 * @param code - Why the store rejected it. Every code is listed, so a new store code fails the type check here.
 * @returns The translated message.
 * @example
 * getComponentErrorMessage(t, 'label', 'tooLong');           // 'Use 20 characters or fewer.'
 * getComponentErrorMessage(t, 'limits.cleaning', 'outOfRange'); // 'Enter a number above 0 and up to 500,000.'
 */
export function getComponentErrorMessage(t: TFunction, field: ComponentField, code: ComponentErrorCode): string {
  switch (code) {
    case 'required':
      return t('components.errors.required');
    case 'tooLong':
      return t('components.errors.tooLong', {
        max: field === 'label' ? COMPONENT_LIMITS.labelMaxLength : COMPONENT_LIMITS.modelMaxLength,
      });
    case 'invalidFormat': {
      const example = NUMBER_EXAMPLES[field];

      return example === undefined
        ? t('components.errors.invalidFormat.text')
        : t('components.errors.invalidFormat.number', { example });
    }
    case 'outOfRange':
      if (field === 'initialDistance') {
        return t('components.errors.outOfRange.distance', { max: COMPONENT_LIMITS.initialDistanceMax });
      }

      return t('components.errors.outOfRange.limit', {
        max: field === 'limits.stretch' ? COMPONENT_LIMITS.stretchMax : COMPONENT_LIMITS.limitDistanceMax,
      });
    // Not raised for the forms' own fields today: the type is chosen from the known ones, hidden chain limits are left
    // out, and the starting distance can change while the forms are open only through an edit screen.
    case 'invalidOption':
    case 'notAllowed':
    case 'tooMany':
    case 'notFound':
      return t('components.errors.rejected');
  }
}
