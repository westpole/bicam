import type { Bicycle } from '../../bicycle/types';
import { ACTIVE_LIMITS } from '../../components/constants';
import type {
  BicycleComponent,
  BicycleComponentType,
  ComponentHistoryEntry,
  ComponentUsagePeriod,
} from '../../components/types';
import { createUsagePeriodId } from '../../components/utilities/createUsagePeriodId';
import { getDefaultLimits } from '../../components/utilities/getDefaultLimits';
import type { BicycleComponentV1, ComponentHistoryEntryV1, PersistedAppState, PersistedAppStateV1 } from '../types';

/**
 * Finds the starting distance of a migrated component: the distance of its newest whole-component history entry that
 * has one. Newest means the latest `date`, then the last one added. Subcomponent entries count from their own
 * installation, so they are ignored.
 *
 * @param history - The component's version 1 history, in insertion order.
 * @returns That distance, or `0` when no such entry exists.
 */
function findInitialDistance(history: readonly ComponentHistoryEntryV1[]): number {
  let newest: ComponentHistoryEntryV1 | null = null;

  for (const entry of history) {
    // ISO dates compare correctly as text; `>=` lets a later entry win a tie.
    if (entry.subcomponent === null && entry.distance !== null && (newest === null || entry.date >= newest.date)) {
      newest = entry;
    }
  }

  return newest?.distance ?? 0;
}

/**
 * Decides which components start in use on each bicycle: every assigned component, unless the bicycle has more
 * components of its type than `ACTIVE_LIMITS` allows. Then none of that type starts, because a wrong guess would credit
 * the wrong part. Each component counts once per bicycle, even when listed twice. A component listed by two bicycles
 * (which the store never allowed) starts on, and counts for, the first one only, so it never gets two open periods.
 *
 * @param state - Valid version 1 data.
 * @returns The bicycle each started component is in use on, keyed by component id.
 */
function findStartedComponents(state: PersistedAppStateV1): Map<string, string> {
  const started = new Map<string, string>();

  for (const bicycleId of state.bicycle.allIds) {
    const ids = new Set(state.bicycle.byId[bicycleId].components);
    const listed = [...ids].filter((id) => !started.has(id)).map((id) => state.components.byId[id]);
    const counts = new Map<BicycleComponentType, number>();

    for (const { type } of listed) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }

    for (const { id, type } of listed) {
      const limit = ACTIVE_LIMITS[type];

      if (limit === null || (counts.get(type) ?? 0) <= limit) {
        started.set(id, bicycleId);
      }
    }
  }

  return started;
}

/**
 * Upgrades one version 1 component.
 *
 * @param component - The version 1 component.
 * @param startedOn - The bicycle it starts in use on, or `undefined` when it rests or is spare.
 * @returns The version 2 component.
 */
function migrateComponent(component: BicycleComponentV1, startedOn: string | undefined): BicycleComponent {
  const usage: ComponentUsagePeriod[] =
    startedOn === undefined
      ? []
      : [
          {
            id: createUsagePeriodId(),
            bicycleId: startedOn,
            start: { date: null, odometer: 0 },
            end: null,
            replacedPeriodId: null,
          },
        ];
  const history = component.history.map((entry): ComponentHistoryEntry => ({
    ...entry,
    lubricant: null,
    cleaned: null,
  }));

  return {
    id: component.id,
    type: component.type,
    model: component.model,
    label: null,
    initialDistance: findInitialDistance(component.history),
    limits: getDefaultLimits(component.type),
    usage,
    retired: null,
    history,
  };
}

/**
 * Upgrades valid version 1 data to version 2, keeping every bicycle, component, and history entry and their order.
 * Documented in `docs/store/README.md` §4.
 *
 * - Bicycles get `odometer: 0` and `odometerDate: null`.
 * - Components get no label, the default limits of their type, and the starting distance of their newest
 *   whole-component history entry with a distance. Assigned components start in use at odometer 0 on an unknown date,
 *   unless their type is over-full on that bicycle (see `ACTIVE_LIMITS`); spare components have no usage.
 * - History entries get `lubricant: null` and `cleaned: null`.
 *
 * @param state - Data that `isPersistedAppStateV1` accepted.
 * @returns New version 2 data; `state` is not mutated.
 * @example
 * migrateFromVersion1({ bicycle: { byId: {}, allIds: [] }, components: { byId: {}, allIds: [] } });
 * // { bicycle: { byId: {}, allIds: [] }, components: { byId: {}, allIds: [] } }
 */
export function migrateFromVersion1(state: PersistedAppStateV1): PersistedAppState {
  const started = findStartedComponents(state);
  const bicycles = state.bicycle.allIds.map((id): Bicycle => ({
    ...state.bicycle.byId[id],
    odometer: 0,
    odometerDate: null,
  }));
  const components = state.components.allIds.map((id) => migrateComponent(state.components.byId[id], started.get(id)));

  return {
    bicycle: {
      byId: Object.fromEntries(bicycles.map((bicycle) => [bicycle.id, bicycle])),
      allIds: [...state.bicycle.allIds],
    },
    components: {
      byId: Object.fromEntries(components.map((component) => [component.id, component])),
      allIds: [...state.components.allIds],
    },
  };
}
