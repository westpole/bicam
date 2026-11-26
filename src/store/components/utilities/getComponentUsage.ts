import type { Bicycle, BicycleId } from '../../bicycle/types';
import type { IsoDate } from '../../common/types';
import { CHAIN_CARE_TYPES } from '../constants';
import type { BicycleComponent, ComponentHistoryEntry, ComponentUsage, ComponentUsagePeriod } from '../types';

/**
 * Rounds kilometres to 1 decimal, so floating-point sums such as `0.1 + 0.2` give `0.3`.
 *
 * @param value - Kilometres.
 * @returns The value with at most 1 decimal.
 * @example
 * roundDistance(0.1 + 0.2); // 0.3
 */
function roundDistance(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Finds the reading where a period ends: its `end`, or the bicycle's odometer while it is open. An open period whose
 * bicycle is not given (it would break rule 1) counts as zero length.
 *
 * @param period - A usage period.
 * @param bicycles - Bicycles keyed by id.
 * @returns The end reading in kilometres.
 * @example
 * getEndReading(openPeriod, state.bicycle.byId); // the bicycle's odometer
 */
function getEndReading(period: ComponentUsagePeriod, bicycles: Readonly<Record<BicycleId, Bicycle>>): number {
  if (period.end !== null) {
    return period.end.odometer;
  }

  const bicycle = Object.prototype.hasOwnProperty.call(bicycles, period.bicycleId)
    ? bicycles[period.bicycleId]
    : undefined;

  return bicycle?.odometer ?? period.start.odometer;
}

/**
 * Finds the newest entry that has a date: the latest date, then the last one added.
 *
 * @param entries - History entries in insertion order.
 * @param getDate - Picks the date to compare, or `null` when the entry does not count.
 * @returns The newest entry, or `null` when none counts.
 * @example
 * findNewest(history, (entry) => entry.cleaned);
 */
function findNewest(
  entries: readonly ComponentHistoryEntry[],
  getDate: (entry: ComponentHistoryEntry) => IsoDate | null,
): ComponentHistoryEntry | null {
  let newest: ComponentHistoryEntry | null = null;
  let newestDate: IsoDate | null = null;

  for (const entry of entries) {
    const date = getDate(entry);

    // ISO dates compare correctly as text; `>=` lets a later entry win a tie.
    if (date !== null && (newestDate === null || date >= newestDate)) {
      newest = entry;
      newestDate = date;
    }
  }

  return newest;
}

/**
 * Finds the distance ridden since a care entry: `null` without an entry or without its distance, never below 0.
 *
 * @param entry - The newest care entry, or `null`.
 * @param distance - The component's current distance.
 * @returns Kilometres since the entry, or `null` when unknown.
 * @example
 * getDistanceSince(newestClean, 1500); // 1500 for a clean at 0
 */
function getDistanceSince(entry: ComponentHistoryEntry | null, distance: number): number | null {
  if (entry === null || entry.distance === null) {
    return null;
  }

  return roundDistance(Math.max(0, distance - entry.distance));
}

/**
 * Derives a component's distance and chain care state. Pure: it reads no date and writes nothing, and it returns a new
 * object on each call, so a React caller memoizes it instead of selecting it from the store.
 *
 * - `distance` is `initialDistance` plus every period's length; an open period runs to its bicycle's odometer. Closed
 *   periods are not looked up, so a removed bicycle keeps counting.
 * - Care values come from whole-component entries of the types in `CHAIN_CARE_TYPES`; other types get `null`. The
 *   newest entry wins: latest date (`date` for stretch, `lubricated`, `cleaned`), then the last one added.
 *
 * @param component - A stored component.
 * @param bicycles - Bicycles keyed by id (`state.bicycle.byId`).
 * @returns The derived usage. Distances have at most 1 decimal.
 * @example
 * const usage = useMemo(() => getComponentUsage(component, bicycles), [component, bicycles]);
 */
export function getComponentUsage(
  component: BicycleComponent,
  bicycles: Readonly<Record<BicycleId, Bicycle>>,
): ComponentUsage {
  let total = component.initialDistance;
  let distanceSinceInstalled: number | null = null;

  for (const period of component.usage) {
    const length = getEndReading(period, bicycles) - period.start.odometer;

    total += length;

    if (period.end === null) {
      distanceSinceInstalled = roundDistance(length);
    }
  }

  const distance = roundDistance(total);
  const usage = {
    distance,
    distanceSinceInstalled,
    // Only an open period sets `distanceSinceInstalled`, so it is non-null exactly while the component is in use.
    isInUse: distanceSinceInstalled !== null,
  };

  if (!CHAIN_CARE_TYPES.includes(component.type)) {
    return {
      ...usage,
      stretch: null,
      lubricant: null,
      distanceSinceLubrication: null,
      distanceSinceCleaning: null,
    };
  }

  const entries = component.history.filter(({ subcomponent }) => subcomponent === null);
  const measured = findNewest(entries, (entry) => (entry.stretch === null ? null : entry.date));
  const lubrication = findNewest(entries, (entry) => entry.lubricated);
  const cleaning = findNewest(entries, (entry) => entry.cleaned);

  return {
    ...usage,
    stretch: measured?.stretch ?? null,
    lubricant: lubrication?.lubricant ?? null,
    distanceSinceLubrication: getDistanceSince(lubrication, distance),
    distanceSinceCleaning: getDistanceSince(cleaning, distance),
  };
}
