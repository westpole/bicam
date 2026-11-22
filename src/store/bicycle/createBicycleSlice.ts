import type { StateCreator } from 'zustand';

import type { AppStore } from '../types';
import type { BicycleActions, BicycleResult } from './types';
import { definedChanges } from './utilities/definedChanges';
import { hasBicycle } from './utilities/hasBicycle';
import { isBicycleIdTaken } from './utilities/isBicycleIdTaken';
import { normalizeBicycleInput } from './utilities/normalizeBicycleInput';
import { validateBicycle } from './utilities/validateBicycle';

/**
 * Creates the bicycle actions for {@link useAppStore}. Data lives in `state.bicycle`; every successful write replaces
 * `bicycle` and the changed `byId` / `allIds` objects, and a failed write does not call `set`.
 *
 * @param set - Zustand `set`.
 * @param get - Zustand `get`.
 * @returns The bicycle actions.
 * @example
 * create<AppStore>()((set, get, api) => ({ ...INITIAL_APP_STATE, ...createBicycleSlice(set, get, api) }));
 */
export const createBicycleSlice: StateCreator<AppStore, [], [], BicycleActions> = (set, get) => ({
  addBicycle: (input): BicycleResult => {
    const bicycle = normalizeBicycleInput(input);
    const errors = validateBicycle(bicycle);

    // `id` is the first Bicycle field, so unshift keeps one error per field in field order.
    if (!errors.some(({ field }) => field === 'id') && isBicycleIdTaken(get().bicycle, bicycle.id)) {
      errors.unshift({ field: 'id', code: 'duplicate' });
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

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

    const current = collection.byId[id];
    const bicycle = normalizeBicycleInput({ ...current, ...definedChanges(changes), id: current.id });
    const errors = validateBicycle(bicycle);

    if (errors.length > 0) {
      return { ok: false, errors };
    }

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
