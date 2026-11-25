/** Color scheme the app is currently showing (MUI's resolved scheme, never `system`). */
export type HeaderColorScheme = 'light' | 'dark';

/** Props for {@link AppHeader}. */
export interface AppHeaderProps {
  /** Whether the app menu is open: the button then shows the close (X) icon and reads "Close menu". Default `false`. */
  menuOpen?: boolean;
  /** DOM id of the menu the button controls, set as `aria-controls`. Omit when no menu is rendered. */
  menuId?: string;
  /** Called when the menu button is clicked (it toggles the menu). */
  onMenuClick?: () => void;
  /** Called when the app title is clicked (it goes to the home screen). The title is only a link when this is given. */
  onHomeClick?: () => void;
  /**
   * The color scheme currently shown. The theme toggle offers the other one: a moon / "Switch to dark theme" in
   * light, a sun / "Switch to light theme" in dark. Default `'light'`.
   */
  colorScheme?: HeaderColorScheme;
  /** Called when the theme toggle is clicked. The toggle is only rendered when this is given. */
  onColorSchemeToggle?: () => void;
}
