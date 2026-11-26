import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { BICYCLE_LIMITS } from './bicycle/constants';
import { createBicycleSlice } from './bicycle/createBicycleSlice';
import { hasBicycle } from './bicycle/utilities/hasBicycle';
import { planBicycleUpdate } from './bicycle/utilities/planBicycleUpdate';
import { unlinkComponent } from './bicycle/utilities/unlinkComponent';
import { withoutBicycle } from './bicycle/utilities/withoutBicycle';
import { createComponentsSlice } from './components/createComponentsSlice';
import type { ComponentAssignPlan } from './components/types';
import { closeUsageOnBicycle } from './components/utilities/closeUsageOnBicycle';
import { hasComponent } from './components/utilities/hasComponent';
import { planComponentAdd } from './components/utilities/planComponentAdd';
import { planComponentAssign } from './components/utilities/planComponentAssign';
import { withoutComponent } from './components/utilities/withoutComponent';
import { INITIAL_APP_STATE } from './constants';
import { createPersistOptions } from './persistence/createPersistOptions';
import type { AppStore, BicycleComponentResult } from './types';

/**
 * The app's single global store: shared UI state (menu visibility, active screen, selected bicycle) that the header,
 * the menu, and the main viewport all depend on, plus the domain data (`bicycle`, `components`; `events` and
 * `history` are placeholders). `bicycle` and `components` are saved to `localStorage` (see `persistence/`); UI state is
 * not, so the app always starts on `home` with the menu closed. See `docs/store/README.md`.
 *
 * Slices own their domain keys only. Navigation and cross-slice side effects of domain actions are added here (see
 * `updateBicycle`, `removeBicycle`, `removeComponent`, `addComponentToBicycle`, and `assignComponent`), so a slice
 * never writes UI state or another slice's key. These wrappers build the next collections with the same pure helpers
 * as the slice actions and write every changed key in one `set`, so `persist` never saves a state that breaks rule 1.
 *
 * Read it with atomic selectors so components only re-render for the fields they use.
 *
 * @example
 * const isMenuOpen = useAppStore((state) => state.isMenuOpen);
 * const toggleMenu = useAppStore((state) => state.toggleMenu);
 */
export const useAppStore = create<AppStore>()(
  persist((set, get, api) => {
    const bicycleSlice = createBicycleSlice(set, get, api);
    const componentsSlice = createComponentsSlice(set, get, api);

    /**
     * Writes a validated assign plan: both collections in one `set`, so no subscriber sees a bicycle that points at a
     * missing component, or a link without its start. A failed plan is returned as it is, without calling `set`.
     *
     * @param plan - From `planComponentAssign`.
     * @returns The action's result.
     */
    const applyAssignPlan = (plan: ComponentAssignPlan): BicycleComponentResult => {
      if (!plan.ok) {
        return plan;
      }

      set({ bicycle: plan.bicycles, components: plan.components });

      return { ok: true, component: plan.component };
    };

    return {
      ...INITIAL_APP_STATE,
      ...bicycleSlice,
      ...componentsSlice,
      updateBicycle: (id, changes) => {
        const { bicycle, components } = get();
        const plan = planBicycleUpdate(bicycle, components, id, changes);

        if (!plan.ok) {
          return plan;
        }

        const stored = bicycle.byId[id];
        const leaving = stored.components.filter((componentId) => !plan.bicycle.components.includes(componentId));

        // One write, so no subscriber sees an open period on a bicycle that no longer lists its component (rule 1).
        set({ bicycle: plan.collection, components: closeUsageOnBicycle(components, stored, leaving) });

        return { ok: true, bicycle: plan.bicycle };
      },
      removeBicycle: (id) => {
        const { bicycle, components, selectedBicycleId } = get();

        if (!hasBicycle(bicycle, id)) {
          return false;
        }

        const stored = bicycle.byId[id];

        // One write: the components stop on the removed bicycle, and the details screen of a bicycle that no longer
        // exists is left in the same update.
        set({
          bicycle: withoutBicycle(bicycle, id),
          components: closeUsageOnBicycle(components, stored, stored.components),
          ...(selectedBicycleId === id ? { selectedBicycleId: null, activeScreen: 'home' as const } : {}),
        });

        return true;
      },
      removeComponent: (id) => {
        const { bicycle, components } = get();

        if (!hasComponent(components, id)) {
          return false;
        }

        // One write, so no subscriber sees a bicycle that points at a missing component.
        set({ bicycle: unlinkComponent(bicycle, id), components: withoutComponent(components, id) });

        return true;
      },
      addComponentToBicycle: (bicycleId, input, use) => {
        const { bicycle, components } = get();

        if (!hasBicycle(bicycle, bicycleId)) {
          return { ok: false, errors: [{ field: 'bicycleId', code: 'notFound' }] };
        }

        // Checked before the input, so a full bicycle is reported alone and never leaves a stored component behind.
        // `planComponentAssign` checks it again, which then always passes.
        if (bicycle.byId[bicycleId].components.length >= BICYCLE_LIMITS.componentsMaxCount) {
          return { ok: false, errors: [{ field: 'components', code: 'tooMany' }] };
        }

        const added = planComponentAdd(components, input);

        if (!added.ok) {
          return added;
        }

        return applyAssignPlan(planComponentAssign(bicycle, added.collection, bicycleId, added.component.id, use));
      },
      assignComponent: (bicycleId, componentId, use) => {
        const { bicycle, components } = get();

        return applyAssignPlan(planComponentAssign(bicycle, components, bicycleId, componentId, use));
      },
      openMenu: () => set({ isMenuOpen: true }),
      closeMenu: () => set({ isMenuOpen: false }),
      toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
      navigateTo: (screen) => set({ activeScreen: screen, selectedBicycleId: null, isMenuOpen: false }),
      openBicycleDetails: (id) => {
        if (!hasBicycle(get().bicycle, id)) {
          return false;
        }

        set({ activeScreen: 'bicycleDetails', selectedBicycleId: id, isMenuOpen: false });

        return true;
      },
      reset: () => set({ ...INITIAL_APP_STATE }),
    };
  }, createPersistOptions()),
);
