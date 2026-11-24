import { create } from 'zustand';

import { createBicycleSlice } from './bicycle/createBicycleSlice';
import { hasBicycle } from './bicycle/utilities/hasBicycle';
import { createComponentsSlice } from './components/createComponentsSlice';
import { INITIAL_APP_STATE } from './constants';
import type { AppStore } from './types';

/**
 * The app's single global store: shared UI state (menu visibility, active screen, selected bicycle) that the header,
 * the menu, and the main viewport all depend on, plus the domain data (`bicycle`, `components`; `events` and
 * `history` are placeholders). Not persisted, so the app always starts empty on `home` with the menu closed. See
 * `docs/store/README.md`.
 *
 * Slices own their domain keys only. Navigation side effects of domain actions are added here, by wrapping the slice
 * action (see `removeBicycle`), so a slice never writes UI state.
 *
 * Read it with atomic selectors so components only re-render for the fields they use.
 *
 * @example
 * const isMenuOpen = useAppStore((state) => state.isMenuOpen);
 * const toggleMenu = useAppStore((state) => state.toggleMenu);
 */
export const useAppStore = create<AppStore>()((set, get, api) => {
  const bicycleSlice = createBicycleSlice(set, get, api);

  return {
    ...INITIAL_APP_STATE,
    ...bicycleSlice,
    ...createComponentsSlice(set, get, api),
    removeBicycle: (id) => {
      const removed = bicycleSlice.removeBicycle(id);

      // Leave the details screen of a bicycle that no longer exists.
      if (removed && get().selectedBicycleId === id) {
        set({ selectedBicycleId: null, activeScreen: 'home' });
      }

      return removed;
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
});
