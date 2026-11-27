import type { TFunction } from 'i18next';

import { COMPONENT_LIMITS } from '@store/components/constants';
import type { StartRange } from '@store/components/types';

import type { LogCareErrorCode, LogCareField } from '../types';

/**
 * A valid value and the most decimals per number field, shown when the text typed there is not a number or has too many
 * decimals (both are `invalidFormat`).
 */
const NUMBER_FORMATS: Readonly<Partial<Record<LogCareField, { example: string; decimals: number }>>> = {
  odometer: { example: '1500', decimals: 1 },
  distance: { example: '1500', decimals: COMPONENT_LIMITS.distanceMaxDecimals },
  stretch: { example: '0.3', decimals: COMPONENT_LIMITS.stretchMaxDecimals },
};

/**
 * Translates why a log care field is invalid into the text shown under it.
 *
 * @param t - The translation function.
 * @param field - The invalid field.
 * @param code - The store's code, or the dialog's own check of the odometer reading.
 * @param readings - The odometer readings that can be used (`getReadingRange`), or `null` for a resting chain.
 * @returns The translated message.
 * @example
 * getCareErrorMessage(t, 'odometer', 'beforeInstallation', { min: 3100, max: 4500 });
 * // 'The chain went in use at 3,100 km. Enter its distance at that time instead and leave the odometer empty.'
 */
export function getCareErrorMessage(
  t: TFunction,
  field: LogCareField,
  code: LogCareErrorCode,
  readings: StartRange | null,
): string {
  const format = NUMBER_FORMATS[field];

  if (code === 'required' && (field === 'lubricant' || field === 'stretch' || field === 'date')) {
    return t(`screens.bicycleDetails.logCare.errors.required.${field}`);
  }

  if (code === 'invalidFormat' && field === 'date') {
    return t('screens.bicycleDetails.logCare.errors.invalidDate');
  }

  if (code === 'invalidFormat' && format !== undefined) {
    return t('screens.bicycleDetails.logCare.errors.invalidNumber', format);
  }

  if (code === 'outOfRange' && field === 'distance') {
    return t('screens.bicycleDetails.logCare.errors.distanceRange', { max: COMPONENT_LIMITS.distanceMax });
  }

  if (code === 'outOfRange' && field === 'stretch') {
    return t('screens.bicycleDetails.logCare.errors.stretchRange', { max: COMPONENT_LIMITS.stretchMax });
  }

  if (code === 'aboveOdometer' && readings !== null) {
    return t('screens.bicycleDetails.logCare.errors.aboveOdometer', { max: readings.max });
  }

  if (code === 'beforeInstallation' && readings !== null) {
    return t('screens.bicycleDetails.logCare.errors.beforeInstallation', { min: readings.min });
  }

  return t('screens.bicycleDetails.logCare.errors.rejected');
}
