import type { BicycleActions, BicycleCollection, BicycleId } from './bicycle/types';
import type { ComponentActions, ComponentCollection } from './components/types';

/**
 * Top-level screens shown in the `<main>` viewport. `home` is the start screen (the user's bicycles);
 * `bicycleDetails` shows the bicycle in `selectedBicycleId`; the others are the destinations of the app menu.
 */
export type ScreenView =
  | 'home'
  | 'addBicycle'
  | 'addComponent'
  | 'addClothesSet'
  | 'beforeRideCheckIn'
  | 'bicycleDetails';

/** Screens reachable from the app menu (every screen except `home` and `bicycleDetails`). */
export type MenuScreen = Exclude<ScreenView, 'home' | 'bicycleDetails'>;

/** Screens that need no selected entity, so {@link AppStoreActions.navigateTo} can open them directly. */
type NavigableScreen = Exclude<ScreenView, 'bicycleDetails'>;

/** Placeholder type for a domain slice that is not implemented yet: an empty object that holds nothing. */
export type ReservedSlice = Readonly<Record<string, never>>;

/** Data held by {@link useAppStore}. Structure documented in `docs/store/README.md`. */
export interface AppStoreState {
  /** Whether the app menu screen is open. */
  isMenuOpen: boolean;
  /** The screen rendered in `<main>`. */
  activeScreen: ScreenView;
  /**
   * The bicycle shown on the `bicycleDetails` screen, or `null` on every other screen. After each action completes,
   * `activeScreen === 'bicycleDetails'` exactly when this is a stored bicycle id.
   */
  selectedBicycleId: BicycleId | null;
  /** The user's bicycles. */
  bicycle: BicycleCollection;
  /** Reserved for maintenance and ride events. */
  events: ReservedSlice;
  /** The user's components. */
  components: ComponentCollection;
  /** Reserved for the change and maintenance log. */
  history: ReservedSlice;
}

/** Actions exposed by {@link useAppStore}: UI actions plus the bicycle and component actions. */
export interface AppStoreActions extends BicycleActions, ComponentActions {
  /** Opens the app menu. Idempotent. */
  openMenu: () => void;
  /** Closes the app menu. Idempotent. */
  closeMenu: () => void;
  /** Opens the menu when it is closed and closes it when it is open. */
  toggleMenu: () => void;
  /** Shows `screen` in `<main>`, clears the selected bicycle, and closes the menu in the same update. */
  navigateTo: (screen: NavigableScreen) => void;
  /**
   * Shows the details screen for the bicycle stored under `id` and closes the menu in one update. Returns `false`,
   * changing nothing, for an unknown id.
   */
  openBicycleDetails: (id: BicycleId) => boolean;
  /** Restores the initial state, including all domain data. */
  reset: () => void;
}

/** The full store: state plus actions. */
export type AppStore = AppStoreState & AppStoreActions;
