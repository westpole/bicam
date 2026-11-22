import type { BicycleCollection } from './bicycle/types';

/**
 * Top-level screens shown in the `<main>` viewport. `home` is the start screen (empty for now); the others are
 * the destinations of the app menu.
 */
export type ScreenView = 'home' | 'addBicycle' | 'addComponent' | 'addClothesSet' | 'beforeRideCheckIn';

/** Screens reachable from the app menu (every screen except `home`). */
export type MenuScreen = Exclude<ScreenView, 'home'>;

/** Placeholder type for a domain slice that is not implemented yet: an empty object that holds nothing. */
export type ReservedSlice = Readonly<Record<string, never>>;

/** Data held by {@link useAppStore}. Structure documented in `docs/store/README.md`. */
export interface AppStoreState {
  /** Whether the app menu screen is open. */
  isMenuOpen: boolean;
  /** The screen rendered in `<main>`. */
  activeScreen: ScreenView;
  /** The user's bicycles. */
  bicycle: BicycleCollection;
  /** Reserved for maintenance and ride events. */
  events: ReservedSlice;
  /** Reserved for components. */
  components: ReservedSlice;
  /** Reserved for the change and maintenance log. */
  history: ReservedSlice;
}

/** Actions exposed by {@link useAppStore}. */
export interface AppStoreActions {
  /** Opens the app menu. Idempotent. */
  openMenu: () => void;
  /** Closes the app menu. Idempotent. */
  closeMenu: () => void;
  /** Opens the menu when it is closed and closes it when it is open. */
  toggleMenu: () => void;
  /** Shows `screen` in `<main>` and closes the menu in the same update. */
  navigateTo: (screen: ScreenView) => void;
  /** Restores the initial state, including all domain data. */
  reset: () => void;
}

/** The full store: state plus actions. */
export type AppStore = AppStoreState & AppStoreActions;
