import type { BicycleCollection, BicycleId } from '../../bicycle/types';
import { hasBicycle } from '../../bicycle/utilities/hasBicycle';
import { ACTIVE_LIMITS, COMPONENT_LIMITS } from '../constants';
import type {
  BicycleComponent,
  BicycleComponentType,
  ComponentCollection,
  ComponentErrorCode,
  ComponentId,
  ComponentStartInput,
  ComponentUsagePeriod,
  ComponentUsagePlan,
  UsageInterval,
  UsagePeriodId,
} from '../types';
import { createUsagePeriodId } from './createUsagePeriodId';
import { findOpenPeriod } from './findOpenPeriod';
import { fitsActiveLimit } from './fitsActiveLimit';
import { getLatestBoundary } from './getLatestBoundary';
import { hasComponent } from './hasComponent';
import { toUsageErrors } from './toUsageErrors';
import { validateReading } from './validateReading';

/** A component in use on the bicycle, with its open period, that a start replaces. */
interface Replaced {
  /** The replaced component. */
  component: BicycleComponent;
  /** Its open period, which ends at the new start. */
  period: ComponentUsagePeriod;
}

/**
 * Counts the other components of one type that are in use on one bicycle now.
 *
 * @param components - The component collection.
 * @param bicycleId - The bicycle.
 * @param component - The component that starts; it never counts, so one already in use is not also "full".
 * @returns How many others have an open period on the bicycle.
 */
function countOthersInUse(components: ComponentCollection, bicycleId: BicycleId, component: BicycleComponent): number {
  return components.allIds.filter((id) => {
    const other = components.byId[id];

    return id !== component.id && other.type === component.type && findOpenPeriod(other)?.bicycleId === bicycleId;
  }).length;
}

/**
 * Lists the readings of every period of one type on one bicycle, with the replaced period ended at `reading` and the
 * new period added, as they would be after the start.
 *
 * @param components - The component collection.
 * @param bicycleId - The bicycle.
 * @param type - The type.
 * @param reading - The new start.
 * @param replacedPeriodId - The period that ends at `reading`, or `null`.
 * @returns The intervals for {@link fitsActiveLimit}.
 */
function getIntervalsAfterStart(
  components: ComponentCollection,
  bicycleId: BicycleId,
  type: BicycleComponentType,
  reading: number,
  replacedPeriodId: UsagePeriodId | null,
): UsageInterval[] {
  const intervals: UsageInterval[] = [{ start: reading, end: null }];

  for (const id of components.allIds) {
    const component = components.byId[id];

    if (component.type !== type) {
      continue;
    }

    for (const period of component.usage) {
      if (period.bicycleId === bicycleId) {
        const end = period.id === replacedPeriodId ? reading : (period.end?.odometer ?? null);
        intervals.push({ start: period.start.odometer, end });
      }
    }
  }

  return intervals;
}

/**
 * Finds the component that a start replaces, or says why it cannot be replaced.
 *
 * @param components - The component collection.
 * @param bicycleId - The bicycle.
 * @param type - The type of the component that starts.
 * @param replacesId - The named component, or `null` for none.
 * @returns The replaced component and its open period, `null` when none was named, or the error code on `replaces`.
 */
function findReplaced(
  components: ComponentCollection,
  bicycleId: BicycleId,
  type: BicycleComponentType,
  replacesId: ComponentId | null,
): Replaced | null | ComponentErrorCode {
  if (replacesId === null) {
    return null;
  }

  const component = hasComponent(components, replacesId) ? components.byId[replacesId] : undefined;
  const period = component && findOpenPeriod(component);

  if (!component || !period || period.bicycleId !== bicycleId || component.type !== type) {
    return 'notAllowed';
  }

  return { component, period };
}

/**
 * Validates and prepares `startComponentUse` (rules 3, 4, and 7 in `docs/store/components.md` §2.3) without writing.
 *
 * - `notFound` on `bicycleId`, then on `componentId`, is returned alone: when both ids are unknown, only the bicycle is
 *   reported.
 * - `componentId` is `notAllowed` when the component is not listed on the bicycle, already in use, or retired.
 * - `replaces` is `required` when the type is full now and none is named, and `notAllowed` when the named component is
 *   not in use on the bicycle or has another type.
 * - `odometer` is `outOfRange` above the bicycle's odometer, below the component's own latest boundary on the bicycle,
 *   below the start of the replaced period, or when the type would be over its `ACTIVE_LIMITS` at any later reading.
 * - Rule 7: a replaced period of zero length is dropped, and the new period takes over its `replacedPeriodId`. A start
 *   at the reading where the component's last period ended on this bicycle reopens that period, keeping its own
 *   `replacedPeriodId` even when the dropped period had one (after A → B → A, taking over B's value would point A's
 *   period at itself), unless the replaced period stays.
 * - When a new period is needed and the component already has `COMPONENT_LIMITS.usageMaxCount`, `usage` is `tooMany`,
 *   returned alone.
 *
 * @param bicycles - The bicycle collection (read only).
 * @param components - The component collection.
 * @param bicycleId - The bicycle to start the component on.
 * @param componentId - The component to start.
 * @param input - The reading and the replaced component.
 * @returns The changed components, or every failing field.
 * @example
 * // Swap chain A for chain B at 1500 km.
 * planComponentStart(state.bicycle, state.components, bikeId, chainB, { date, odometer: 1500, replaces: chainA });
 */
export function planComponentStart(
  bicycles: BicycleCollection,
  components: ComponentCollection,
  bicycleId: BicycleId,
  componentId: ComponentId,
  input: ComponentStartInput,
): ComponentUsagePlan {
  if (!hasBicycle(bicycles, bicycleId)) {
    return { ok: false, errors: [{ field: 'bicycleId', code: 'notFound' }] };
  }

  if (!hasComponent(components, componentId)) {
    return { ok: false, errors: [{ field: 'componentId', code: 'notFound' }] };
  }

  const bicycle = bicycles.byId[bicycleId];
  const component = components.byId[componentId];
  const limit = ACTIVE_LIMITS[component.type];
  const { reading, odometer: numberCode, date: dateCode } = validateReading(input);
  const r = reading.odometer;

  const componentCode: ComponentErrorCode | null =
    !bicycle.components.includes(componentId) || findOpenPeriod(component) !== undefined || component.retired !== null
      ? 'notAllowed'
      : null;
  // `''` means none, like a missing or `null` value.
  const replacesId = input.replaces || null;
  const found = findReplaced(components, bicycleId, component.type, replacesId);
  const replaced = typeof found === 'string' ? null : found;
  let replacesCode = typeof found === 'string' ? found : null;

  if (replacesId === null && limit !== null && countOthersInUse(components, bicycleId, component) >= limit) {
    replacesCode = 'required';
  }

  let odometerCode = numberCode;

  if (odometerCode === null) {
    const isOutOfRange =
      r > bicycle.odometer ||
      r < getLatestBoundary(component.usage, bicycleId) ||
      (replaced !== null && r < replaced.period.start.odometer) ||
      // Only meaningful for a component that can start and a valid replacement.
      (componentCode === null &&
        replacesCode === null &&
        !fitsActiveLimit(
          getIntervalsAfterStart(components, bicycleId, component.type, r, replaced?.period.id ?? null),
          r,
          limit,
        ));

    odometerCode = isOutOfRange ? 'outOfRange' : null;
  }

  const errors = toUsageErrors({
    componentId: componentCode,
    replaces: replacesCode,
    odometer: odometerCode,
    date: dateCode,
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const changed: BicycleComponent[] = [];
  // What the new period records for undo: the replaced period, or what that one replaced when it is dropped.
  let replacedPeriodId: UsagePeriodId | null = null;
  let replacedStays = false;

  if (replaced) {
    const { period } = replaced;

    replacedStays = period.start.odometer < r;
    replacedPeriodId = replacedStays ? period.id : period.replacedPeriodId;
    changed.push({
      ...replaced.component,
      usage: replacedStays
        ? replaced.component.usage.map((other) => (other.id === period.id ? { ...other, end: reading } : other))
        : replaced.component.usage.filter((other) => other.id !== period.id),
    });
  }

  const last = component.usage[component.usage.length - 1] as ComponentUsagePeriod | undefined;
  let usage: ComponentUsagePeriod[];

  if (!replacedStays && last?.bicycleId === bicycleId && last.end?.odometer === r) {
    usage = [...component.usage.slice(0, -1), { ...last, end: null }];
  } else {
    if (component.usage.length >= COMPONENT_LIMITS.usageMaxCount) {
      return { ok: false, errors: [{ field: 'usage', code: 'tooMany' }] };
    }

    usage = [
      ...component.usage,
      { id: createUsagePeriodId(), bicycleId, start: reading, end: null, replacedPeriodId },
    ];
  }

  const started: BicycleComponent = { ...component, usage };

  return { ok: true, component: started, changed: [started, ...changed] };
}
