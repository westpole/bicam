import type { Bicycle } from '@store/bicycle/types';
import type { ComponentId, ComponentStartInput } from '@store/components/types';

import { getToday } from './getToday';

/**
 * Builds the start of a component that goes into use now: today (`getToday`) at the bicycle's current odometer. Used
 * when a component is added or included in use (rule 2); a start at an earlier reading is a swap.
 *
 * @param bicycle - The bicycle it starts on.
 * @param replaces - The component in use that it replaces, or `null` for none.
 * @param now - The moment to read today from; defaults to the current time.
 * @returns The input for `startComponentUse`, `addComponentToBicycle`, or `assignComponent`.
 * @example
 * getCurrentUse(bicycle); // { date: '2026-11-25', odometer: 1500, replaces: null }
 */
export function getCurrentUse(
  bicycle: Bicycle,
  replaces: ComponentId | null = null,
  now: Date = new Date(),
): ComponentStartInput {
  return { date: getToday(now), odometer: bicycle.odometer, replaces };
}
