import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CloseIcon } from '../icons/CloseIcon';
import { MenuIcon } from '../icons/MenuIcon';
import type { AppHeaderProps } from './types';

/**
 * App header: a static `<header>` AppBar (the grid row in `AppShell` pins it) with a menu button followed by
 * the app title as the page's only `<h1>`. Toolbar height comes from the MUI mixins (56px, 48px in narrow
 * landscape, 64px from `sm`).
 *
 * The menu button is a disclosure toggle for the app menu: it shows ≡ / "Open menu" while closed and ✕ /
 * "Close menu" while open, with matching `aria-expanded` (and `aria-controls` when `menuId` is given).
 * Presentational: the open state and menu id come from props, not the store or the menu component.
 *
 * When `onColorSchemeToggle` is given, a light/dark theme toggle sits at the right edge. It shows the scheme it
 * switches to (moon in light, sun in dark) with a matching label. The scheme itself comes from props.
 *
 * @param props - See {@link AppHeaderProps}.
 * @returns The header banner.
 * @example
 * <AppShell
 *   header={
 *     <AppHeader
 *       menuOpen={isMenuOpen}
 *       menuId={APP_MENU_ID}
 *       onMenuClick={toggleMenu}
 *       colorScheme={colorScheme}
 *       onColorSchemeToggle={toggleColorScheme}
 *     />
 *   }
 * />
 */
export function AppHeader({
  menuOpen = false,
  menuId,
  onMenuClick,
  colorScheme = 'light',
  onColorSchemeToggle,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';

  return (
    <AppBar component="header" position="static">
      <Toolbar>
        {/* size="large" gives a 48 × 48 hit area (WCAG 2.5.5); flexShrink: 0 keeps it intact on narrow screens. */}
        <IconButton
          edge="start"
          color="inherit"
          size="large"
          aria-label={menuOpen ? t('header.menuButton.closeLabel') : t('header.menuButton.label')}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={onMenuClick}
          sx={{ mr: 1, flexShrink: 0 }}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
        {/* minWidth: 0 lets the flex item shrink so `noWrap` truncates with an ellipsis. */}
        <Typography variant="h6" component="h1" noWrap sx={{ minWidth: 0 }}>
          {t('app.title')}
        </Typography>
        {onColorSchemeToggle && (
          // ml: 'auto' pushes the toggle to the right edge; same 48 × 48 hit area as the menu button.
          <IconButton
            edge="end"
            color="inherit"
            size="large"
            aria-label={
              isDark ? t('header.themeToggle.switchToLightLabel') : t('header.themeToggle.switchToDarkLabel')
            }
            onClick={onColorSchemeToggle}
            sx={{ ml: 'auto', flexShrink: 0 }}
          >
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}
