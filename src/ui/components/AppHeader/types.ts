/** Props for {@link AppHeader}. */
export interface AppHeaderProps {
  /** Whether the app menu is open: the button then shows the close (X) icon and reads "Close menu". Default `false`. */
  menuOpen?: boolean;
  /** DOM id of the menu the button controls, set as `aria-controls`. Omit when no menu is rendered. */
  menuId?: string;
  /** Called when the menu button is clicked (it toggles the menu). */
  onMenuClick?: () => void;
}
