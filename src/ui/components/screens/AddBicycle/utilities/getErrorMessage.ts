import type { TFunction } from 'i18next';

import type { BicycleErrorCode } from '@store/bicycle/types';

import { FIELD_MAX_LENGTH } from '../constants';
import type { AddBicycleField } from '../types';

/**
 * Translates a store validation error into the text shown under the field.
 *
 * @param t - The translation function.
 * @param field - The invalid field.
 * @param code - Why the store rejected it. Every code is listed, so a new store code fails the type check here.
 * @returns The translated message.
 * @example
 * getErrorMessage(t, 'name', 'tooLong'); // 'Use 40 characters or fewer.'
 */
export function getErrorMessage(t: TFunction, field: AddBicycleField, code: BicycleErrorCode): string {
  switch (code) {
    case 'required':
      return t('screens.addBicycle.errors.required');
    case 'duplicate':
      return t('screens.addBicycle.errors.duplicate');
    case 'tooLong':
      return t('screens.addBicycle.errors.tooLong', { max: FIELD_MAX_LENGTH[field] });
    case 'invalidFormat':
      return t(`screens.addBicycle.errors.invalidFormat.${field === 'size' || field === 'purchased' ? field : 'text'}`);
    // Not raised for the form's own fields today.
    case 'tooMany':
    case 'notFound':
      return t('screens.addBicycle.errors.rejected');
  }
}
