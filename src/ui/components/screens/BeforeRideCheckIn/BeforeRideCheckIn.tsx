import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '../ScreenPlaceholder/ScreenPlaceholder';

/**
 * Placeholder for the "Before ride check-in" screen, opened from the app menu. Will hold the pre-ride safety checklist.
 *
 * @returns The titled placeholder screen.
 */
export function BeforeRideCheckIn() {
  const { t } = useTranslation();

  return <ScreenPlaceholder title={t('screens.beforeRideCheckIn.title')} />;
}
