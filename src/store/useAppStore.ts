import { create } from 'zustand';

import { createBicycleSlice } from './bicycle/createBicycleSlice';
import { INITIAL_APP_STATE } from './constants';
import type { AppStore } from './types';

/**
 * The app's single global store: shared UI state (menu visibility, active screen) that the header, the menu, and the
 * main viewport all depend on, plus the domain data (`bicycle`; `events`, `components`, `history` are placeholders).
 * Not persisted, so the app always starts empty on `home` with the menu closed. See `docs/store/README.md`.
 *
 * Read it with atomic selectors so components only re-render for the fields they use.
 *
 * @example
 * const isMenuOpen = useAppStore((state) => state.isMenuOpen);
 * const toggleMenu = useAppStore((state) => state.toggleMenu);
 */
export const useAppStore = create<AppStore>()((set, get, api) => ({
  ...INITIAL_APP_STATE,
  ...createBicycleSlice(set, get, api),
  openMenu: () => set({ isMenuOpen: true }),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  navigateTo: (screen) => set({ activeScreen: screen, isMenuOpen: false }),
  reset: () => set({ ...INITIAL_APP_STATE }),
}));
