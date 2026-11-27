import type { TFunction } from 'i18next';

import type { BicycleComponent } from '@store/components/types';

/**
 * Names a component in text: its translated type, its model, and its label when it has one, so identical parts can be
 * told apart in a button's accessible name or a dialog.
 *
 * @param t - The translation function.
 * @param component - The component.
 * @returns For example "Chain KMC X12 (A)".
 * @example
 * getComponentName(t, chain); // 'Chain KMC X12 (A)'
 */
export function getComponentName(t: TFunction, { type, model, label }: BicycleComponent): string {
  const options = { type: t(`components.types.${type}`), model, label };

  return label === null
    ? t('screens.bicycleDetails.componentName', options)
    : t('screens.bicycleDetails.componentNameWithLabel', options);
}
