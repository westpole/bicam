import type { TFunction } from 'i18next';

import { CHAIN_CARE_TYPES } from '@store/components/constants';

import type { ComponentFact, ComponentFactKey, ComponentRow } from '../types';

/** A fact's value before it gets its key and term. */
type FactValue = Pick<ComponentFact, 'value' | 'isUnknown' | 'isReached'>;

/**
 * Formats a value that may have a limit: "250 of 300 km", "300 of 300 km, limit reached" (at or above the limit, so
 * text and not only color says so), the plain value without a limit, or "Not specified" when it is unknown.
 *
 * @param t - The translation function.
 * @param value - The value, or `null` when unknown.
 * @param limit - The limit, or `null` for none.
 * @param unit - Kilometres or percent.
 * @returns The formatted value and its state.
 */
function formatLimited(t: TFunction, value: number | null, limit: number | null, unit: 'km' | 'percent'): FactValue {
  if (value === null) {
    return { value: t('components.list.notSpecified'), isUnknown: true, isReached: false };
  }

  if (limit === null) {
    return { value: t(`components.list.${unit}`, { value }), isUnknown: false, isReached: false };
  }

  const text = t(unit === 'km' ? 'components.list.kmOfLimit' : 'components.list.percentOfLimit', { value, limit });
  const isReached = value >= limit;

  return { value: isReached ? t('components.list.limitReached', { value: text }) : text, isUnknown: false, isReached };
}

/**
 * Builds the labelled values shown under a row's model: the label (when set), the distance, the distance since
 * installed (in use only), and for chains the lubricant and the stretch, lubrication, and cleaning against their limits.
 *
 * @param t - The translation function.
 * @param row - The component and its usage.
 * @returns The facts, top to bottom.
 * @example
 * getRowFacts(t, { component: chain, usage }).map(({ term, value }) => `${term}: ${value}`);
 * // ['Distance: 1,500 km', 'Since installed: 1,400 km', 'Lubricant: Wax', 'Stretch: Not specified', …]
 */
export function getRowFacts(t: TFunction, { component, usage }: ComponentRow): ComponentFact[] {
  const values: Array<[ComponentFactKey, FactValue]> = [];
  const plain = (value: string): FactValue => ({ value, isUnknown: false, isReached: false });

  if (component.label !== null) {
    values.push(['label', plain(component.label)]);
  }

  values.push(['distance', plain(t('components.list.km', { value: usage.distance }))]);

  if (usage.distanceSinceInstalled !== null) {
    values.push(['sinceInstalled', plain(t('components.list.km', { value: usage.distanceSinceInstalled }))]);
  }

  if (CHAIN_CARE_TYPES.includes(component.type)) {
    const { limits } = component;

    values.push(
      [
        'lubricant',
        usage.lubricant === null
          ? { value: t('components.list.notSpecified'), isUnknown: true, isReached: false }
          : plain(t(`components.lubricants.${usage.lubricant}`)),
      ],
      ['stretch', formatLimited(t, usage.stretch, limits.stretch, 'percent')],
      ['sinceLubrication', formatLimited(t, usage.distanceSinceLubrication, limits.lubrication, 'km')],
      ['sinceCleaning', formatLimited(t, usage.distanceSinceCleaning, limits.cleaning, 'km')],
    );
  }

  return values.map(([key, value]) => ({ key, term: t(`components.list.${key}`), ...value }));
}
