import { INITIAL_BICYCLE_COLLECTION } from './bicycle/constants';
import type { AppStoreState } from './types';

/**
 * Baseline state of {@link useAppStore}: menu closed, start screen active, no bicycle selected, no domain data.
 * Shared by `reset()`, tests, and stories. Frozen, including its nested slices, because every reset shares these
 * objects; actions must replace them, never mutate them.
 */
export const INITIAL_APP_STATE: Readonly<AppStoreState> = Object.freeze({
  isMenuOpen: false,
  activeScreen: 'home',
  selectedBicycleId: null,
  bicycle: INITIAL_BICYCLE_COLLECTION,
  events: Object.freeze({}),
  components: Object.freeze({}),
  history: Object.freeze({}),
});
