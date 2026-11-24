import type { StateCreator } from 'zustand';

import { definedChanges } from '../common/utilities/definedChanges';
import type { AppStore } from '../types';
import type { BicycleComponent, ComponentActions, ComponentResult } from './types';
import { createComponentId } from './utilities/createComponentId';
import { hasComponent } from './utilities/hasComponent';
import { normalizeComponentInput } from './utilities/normalizeComponentInput';
import { validateComponent } from './utilities/validateComponent';

/**
 * Creates the component actions for {@link useAppStore}. Data lives in `state.components`; every successful write
 * replaces `components` and the changed `byId` / `allIds` objects, and a failed write does not call `set`.
 *
 * @param set - Zustand `set`.
 * @param get - Zustand `get`.
 * @returns The component actions.
 * @example
 * create<AppStore>()((set, get, api) => ({ ...INITIAL_APP_STATE, ...createComponentsSlice(set, get, api) }));
 */
export const createComponentsSlice: StateCreator<AppStore, [], [], ComponentActions> = (set, get) => ({
  addComponent: (input): ComponentResult => {
    const validation = validateComponent(normalizeComponentInput(input));

    if (!validation.ok) {
      return validation;
    }

    const component: BicycleComponent = { id: createComponentId(), ...validation.details, history: [] };

    set((state) => ({
      components: {
        byId: { ...state.components.byId, [component.id]: component },
        allIds: [...state.components.allIds, component.id],
      },
    }));

    return { ok: true, component };
  },

  updateComponent: (id, changes): ComponentResult => {
    const collection = get().components;

    if (!hasComponent(collection, id)) {
      return { ok: false, errors: [{ field: 'id', code: 'notFound' }] };
    }

    const stored = collection.byId[id];
    // normalizeComponentInput picks known fields only, so `id` and `history` keys in `changes` are ignored.
    const validation = validateComponent(normalizeComponentInput({ ...stored, ...definedChanges(changes) }));

    if (!validation.ok) {
      return validation;
    }

    const { type, model } = validation.details;

    // Nothing to write: keep the stored object, so subscribers are not notified.
    if (type === stored.type && model === stored.model) {
      return { ok: true, component: stored };
    }

    const component: BicycleComponent = { id, type, model, history: stored.history };

    set((state) => ({
      components: { byId: { ...state.components.byId, [id]: component }, allIds: state.components.allIds },
    }));

    return { ok: true, component };
  },

  removeComponent: (id) => {
    if (!hasComponent(get().components, id)) {
      return false;
    }

    set((state) => ({
      components: {
        byId: Object.fromEntries(Object.entries(state.components.byId).filter(([storedId]) => storedId !== id)),
        allIds: state.components.allIds.filter((storedId) => storedId !== id),
      },
    }));

    return true;
  },
});
