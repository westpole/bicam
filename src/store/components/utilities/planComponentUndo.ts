import type { BicycleCollection, BicycleId } from '../../bicycle/types';
import { hasBicycle } from '../../bicycle/utilities/hasBicycle';
import { ACTIVE_LIMITS } from '../constants';
import type {
  BicycleComponent,
  ComponentCollection,
  ComponentId,
  ComponentUndoPlan,
  ComponentUsagePeriod,
  UndoBlockReason,
  UsageInterval,
} from '../types';
import { findOpenPeriod } from './findOpenPeriod';
import { fitsActiveLimit } from './fitsActiveLimit';
import { hasComponent } from './hasComponent';

/** The period a start replaced, with the component that holds it. */
interface ReplacedPeriod {
  /** The component the period belongs to. */
  component: BicycleComponent;
  /** The replaced period. */
  period: ComponentUsagePeriod;
}

/**
 * Finds the stored component that holds a period.
 *
 * @param components - The component collection.
 * @param periodId - The period.
 * @param undoneId - The component whose start is undone; never the holder.
 * @returns The component and the period, or `undefined` when no other component holds it (it was removed).
 */
function findReplacedPeriod(
  components: ComponentCollection,
  periodId: string,
  undoneId: ComponentId,
): ReplacedPeriod | undefined {
  for (const id of components.allIds) {
    const period = components.byId[id].usage.find((candidate) => candidate.id === periodId);

    if (id !== undoneId && period) {
      return { component: components.byId[id], period };
    }
  }

  return undefined;
}

/**
 * Lists the readings of every period of one type on one bicycle after the undo: the undone period left out and the
 * replaced period open again.
 *
 * @param components - The component collection.
 * @param bicycleId - The bicycle.
 * @param undone - The undone component and its open period.
 * @param undone.component - The component whose start is undone.
 * @param undone.period - Its open period, which is removed.
 * @param replacedPeriodId - The period that reopens.
 * @returns The intervals for {@link fitsActiveLimit}.
 */
function getIntervalsAfterUndo(
  components: ComponentCollection,
  bicycleId: BicycleId,
  undone: { component: BicycleComponent; period: ComponentUsagePeriod },
  replacedPeriodId: string,
): UsageInterval[] {
  const intervals: UsageInterval[] = [];

  for (const id of components.allIds) {
    const component = components.byId[id];

    if (component.type !== undone.component.type) {
      continue;
    }

    for (const period of component.usage) {
      if (period.bicycleId === bicycleId && period.id !== undone.period.id) {
        intervals.push({
          start: period.start.odometer,
          end: period.id === replacedPeriodId ? null : (period.end?.odometer ?? null),
        });
      }
    }
  }

  return intervals;
}

/**
 * Says why a replaced period cannot reopen, checking in this order: its component was removed, retired, is not listed
 * on the bicycle, has a later period or is in use, or reopening would put more of the type in use than
 * `ACTIVE_LIMITS` allows at some reading from the period's end on.
 *
 * @param bicycles - The bicycle collection.
 * @param components - The component collection.
 * @param undone - The undone component and its open period.
 * @param undone.component - The component whose start is undone.
 * @param undone.period - Its open period.
 * @param replaced - The replaced period and its component, or `undefined` when no component holds it any more.
 * @returns The reason, or `null` when the period can reopen.
 */
function getBlockReason(
  bicycles: BicycleCollection,
  components: ComponentCollection,
  undone: { component: BicycleComponent; period: ComponentUsagePeriod },
  replaced: ReplacedPeriod | undefined,
): UndoBlockReason | null {
  if (!replaced) {
    return 'removed';
  }

  const { component, period } = replaced;
  const { bicycleId } = undone.period;

  if (component.retired !== null) {
    return 'retired';
  }

  if (!hasBicycle(bicycles, bicycleId) || !bicycles.byId[bicycleId].components.includes(component.id)) {
    return 'notOnBicycle';
  }

  if (component.usage[component.usage.length - 1] !== period || period.end === null) {
    return 'usedSince';
  }

  const intervals = getIntervalsAfterUndo(components, bicycleId, undone, period.id);

  return fitsActiveLimit(intervals, period.end.odometer, ACTIVE_LIMITS[component.type]) ? null : 'noRoom';
}

/**
 * Validates and prepares `undoComponentStart` (rule 10 in `docs/store/components.md` §2.3) without writing.
 *
 * - `notFound` on `componentId` is returned alone; `componentId` is `notAllowed` when the component is not in use.
 * - The component's open period is removed, so it loses the distance since that start. History entries stay.
 * - When the period replaced another one (`replacedPeriodId`), that period reopens if it is still its component's last
 *   period, the component is not retired and is listed on the bicycle, and the type stays within `ACTIVE_LIMITS`.
 *   Otherwise nothing takes its place and `blockedBy` says why. Several undos in a row go back one swap at a time.
 *
 * @param bicycles - The bicycle collection (read only).
 * @param components - The component collection.
 * @param componentId - The component whose start is undone.
 * @returns The changed components and the one that comes back, or every failing field.
 * @example
 * // Undo the late swap B → A at 3100: A loses 1400 km, and B is in use again from 1500.
 * planComponentUndo(state.bicycle, state.components, chainA);
 * // { ok: true, component: chainA, changed: [chainA, chainB], replaced: chainB, restored: chainB, blockedBy: null }
 */
export function planComponentUndo(
  bicycles: BicycleCollection,
  components: ComponentCollection,
  componentId: ComponentId,
): ComponentUndoPlan {
  if (!hasComponent(components, componentId)) {
    return { ok: false, errors: [{ field: 'componentId', code: 'notFound' }] };
  }

  const component = components.byId[componentId];
  const period = findOpenPeriod(component);

  if (!period) {
    return { ok: false, errors: [{ field: 'componentId', code: 'notAllowed' }] };
  }

  const undone: BicycleComponent = { ...component, usage: component.usage.filter(({ id }) => id !== period.id) };

  if (period.replacedPeriodId === null) {
    return { ok: true, component: undone, changed: [undone], replaced: null, restored: null, blockedBy: null };
  }

  const replaced = findReplacedPeriod(components, period.replacedPeriodId, componentId);
  const blockedBy = getBlockReason(bicycles, components, { component, period }, replaced);

  if (!replaced || blockedBy !== null) {
    return {
      ok: true,
      component: undone,
      changed: [undone],
      replaced: replaced?.component ?? null,
      restored: null,
      blockedBy,
    };
  }

  const restored: BicycleComponent = {
    ...replaced.component,
    usage: replaced.component.usage.map((other) => (other.id === replaced.period.id ? { ...other, end: null } : other)),
  };

  return {
    ok: true,
    component: undone,
    changed: [undone, restored],
    replaced: replaced.component,
    restored,
    blockedBy: null,
  };
}
