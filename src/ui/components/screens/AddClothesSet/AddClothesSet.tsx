import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '../ScreenPlaceholder/ScreenPlaceholder';

/**
 * Placeholder for the "Add clothes set" screen, opened from the app menu. Will hold the form for adding a set of riding clothes.
 *
 * @returns The titled placeholder screen.
 */
export function AddClothesSet() {
  const { t } = useTranslation();

  return <ScreenPlaceholder title={t('screens.addClothesSet.title')} />;
}
