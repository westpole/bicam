import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '../ScreenPlaceholder/ScreenPlaceholder';

/**
 * Placeholder for the "Add bicycle" screen, opened from the app menu. Will hold the form for adding a bicycle.
 *
 * @returns The titled placeholder screen.
 */
export function AddBicycle() {
  const { t } = useTranslation();

  return <ScreenPlaceholder title={t('screens.addBicycle.title')} />;
}
