import type { StateCreator } from 'zustand';

import type { AppStore } from '../types';
import type { BicycleComponent, ComponentActions, ComponentResult } from './types';
import { createComponentId } from './utilities/createComponentId';
import { normalizeComponentInput } from './utilities/normalizeComponentInput';
import { validateComponent } from './utilities/validateComponent';

/**
 * Creates the component actions for {@link useAppStore}. Data lives in `state.components`; every successful write
 * replaces `components` and the changed `byId` / `allIds` objects, and a failed write does not call `set`.
 *
 * @param set - Zustand `set`.
 * @returns The component actions.
 * @example
 * create<AppStore>()((set, get, api) => ({ ...INITIAL_APP_STATE, ...createComponentsSlice(set, get, api) }));
 */
export const createComponentsSlice: StateCreator<AppStore, [], [], ComponentActions> = (set) => ({
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
});
