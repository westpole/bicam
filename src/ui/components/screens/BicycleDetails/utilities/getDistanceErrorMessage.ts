import type { TFunction } from 'i18next';

import { BICYCLE_LIMITS } from '@store/bicycle/constants';
import type { BicycleErrorCode } from '@store/bicycle/types';

import type { UpdateDistanceField, UpdateDistanceMode } from '../types';

/**
 * Translates a store validation error of an odometer reading into the text shown under the dialog's field.
 *
 * @param t - The translation function.
 * @param field - The dialog field: the distance (the store's `odometer`) or the date (`odometerDate`).
 * @param code - Why the store rejected it.
 * @param minimum - The lowest allowed total, named when the total is out of range.
 * @param mode - How the distance was entered. An out-of-range ride is worded as a ride, because the error shows under
 * the "Ride distance" field while the store checked the resulting total.
 * @returns The translated message.
 * @example
 * getDistanceErrorMessage(t, 'distance', 'outOfRange', 3100, 'total'); // 'The total must be from 3,100 to 500,000 km.'
 */
export function getDistanceErrorMessage(
  t: TFunction,
  field: UpdateDistanceField,
  code: BicycleErrorCode,
  minimum: number,
  mode: UpdateDistanceMode,
): string {
  if (field === 'date') {
    return code === 'invalidFormat'
      ? t('screens.bicycleDetails.updateDistance.errors.invalidDate')
      : t('screens.bicycleDetails.updateDistance.errors.rejected');
  }

  switch (code) {
    case 'invalidFormat':
      return t('screens.bicycleDetails.updateDistance.errors.invalidNumber');
    case 'outOfRange':
      return t(
        mode === 'ride'
          ? 'screens.bicycleDetails.updateDistance.errors.outOfRangeRide'
          : 'screens.bicycleDetails.updateDistance.errors.outOfRange',
        { min: minimum, max: BICYCLE_LIMITS.odometerMax },
      );
    default:
      return t('screens.bicycleDetails.updateDistance.errors.rejected');
  }
}
