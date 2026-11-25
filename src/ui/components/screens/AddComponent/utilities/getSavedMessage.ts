import type { TFunction } from 'i18next';

import type { BicycleComponent } from '@store/components/types';

/**
 * Builds the message that confirms a save. It names the component by type, model, and label, so a rider adding several
 * identical parts sees which one was stored last.
 *
 * @param t - The translation function.
 * @param component - The stored component.
 * @returns The translated message.
 * @example
 * getSavedMessage(t, chainA); // 'Chain KMC X12 (A) was added.'
 */
export function getSavedMessage(t: TFunction, component: BicycleComponent): string {
  const { type, model, label } = component;
  const typeName = t(`components.types.${type}`);

  return label === null
    ? t('screens.addComponent.saved', { type: typeName, model })
    : t('screens.addComponent.savedWithLabel', { type: typeName, model, label });
}
