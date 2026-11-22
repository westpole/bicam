import type { AppStoreState } from './types';

/** Baseline state of {@link useAppStore}: menu closed, start screen active. Shared by `reset()`, tests, and stories. */
export const INITIAL_APP_STATE: Readonly<AppStoreState> = {
  isMenuOpen: false,
  activeScreen: 'home',
};
