import type { StateCreator } from 'zustand';

import { definedChanges } from '../common/utilities/definedChanges';
import type { AppStore } from '../types';
import type { Bicycle, BicycleActions, BicycleResult } from './types';
import { createBicycleId } from './utilities/createBicycleId';
import { hasBicycle } from './utilities/hasBicycle';
import { normalizeBicycleInput } from './utilities/normalizeBicycleInput';
import { validateBicycleInCollection } from './utilities/validateBicycleInCollection';

/**
 * Creates the bicycle actions for {@link useAppStore}. Data lives in `state.bicycle`; every successful write replaces
 * `bicycle` and the changed `byId` / `allIds` objects, and a failed write does not call `set`. Reads
 * `state.components` to check component ids, and never writes it.
 *
 * @param set - Zustand `set`.
 * @param get - Zustand `get`.
 * @returns The bicycle actions.
 * @example
 * create<AppStore>()((set, get, api) => ({ ...INITIAL_APP_STATE, ...createBicycleSlice(set, get, api) }));
 */
export const createBicycleSlice: StateCreator<AppStore, [], [], BicycleActions> = (set, get) => ({
  addBicycle: (input): BicycleResult => {
    const details = normalizeBicycleInput(input);
    const errors = validateBicycleInCollection(get().bicycle, get().components, details);

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const bicycle: Bicycle = { id: createBicycleId(), ...details, odometer: 0, odometerDate: null };

    set((state) => ({
      bicycle: {
        byId: { ...state.bicycle.byId, [bicycle.id]: bicycle },
        allIds: [...state.bicycle.allIds, bicycle.id],
      },
    }));

    return { ok: true, bicycle };
  },

  updateBicycle: (id, changes): BicycleResult => {
    const collection = get().bicycle;

    if (!hasBicycle(collection, id)) {
      return { ok: false, errors: [{ field: 'id', code: 'notFound' }] };
    }

    const stored = collection.byId[id];
    // normalizeBicycleInput picks known fields only, so `id` and odometer keys in `changes` are ignored.
    const details = normalizeBicycleInput({ ...stored, ...definedChanges(changes) });
    const errors = validateBicycleInCollection(collection, get().components, details, id);

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const bicycle: Bicycle = { id, ...details, odometer: stored.odometer, odometerDate: stored.odometerDate };

    set((state) => ({
      bicycle: { byId: { ...state.bicycle.byId, [id]: bicycle }, allIds: state.bicycle.allIds },
    }));

    return { ok: true, bicycle };
  },

  removeBicycle: (id) => {
    if (!hasBicycle(get().bicycle, id)) {
      return false;
    }

    set((state) => ({
      bicycle: {
        byId: Object.fromEntries(Object.entries(state.bicycle.byId).filter(([storedId]) => storedId !== id)),
        allIds: state.bicycle.allIds.filter((storedId) => storedId !== id),
      },
    }));

    return true;
  },
});
