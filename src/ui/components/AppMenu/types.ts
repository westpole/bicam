import type { MenuScreen, ScreenView } from '@store/types';

/** One app menu option: the screen it opens and the translation key of its label. */
export interface AppMenuItemDefinition {
  /** Screen opened by the option. */
  id: MenuScreen;
  /** Translation key of the option's label. */
  labelKey: `menu.items.${MenuScreen}`;
}

/** Props for {@link AppMenu}. */
export interface AppMenuProps {
  /** Whether the menu is shown. Changing it slides the menu down (open) or up (close). */
  open: boolean;
  /** The screen currently in `<main>`; its option is marked as current. */
  activeScreen: ScreenView;
  /** Called with the chosen option's screen. */
  onSelect: (screen: MenuScreen) => void;
  /** Called when the user asks to close the menu with Escape. */
  onClose: () => void;
}
