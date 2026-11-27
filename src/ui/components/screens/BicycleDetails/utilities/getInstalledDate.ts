import type { BicycleComponent } from '@store/components/types';

/**
 * Picks the `installed` date of a care entry: the start date of the component's first usage period, or the entry's own
 * date when that start is unknown (for example, set by the migration) or the component was never used.
 *
 * @param component - The component the entry belongs to.
 * @param date - The entry's date, as submitted.
 * @returns The date to save as `installed`.
 * @example
 * getInstalledDate(chainUsedSince20260301, '2026-04-12'); // '2026-03-01'
 * getInstalledDate(neverUsedChain, '2026-04-12');         // '2026-04-12'
 */
export function getInstalledDate(component: BicycleComponent, date: string): string {
  return component.usage[0]?.start.date ?? date;
}
