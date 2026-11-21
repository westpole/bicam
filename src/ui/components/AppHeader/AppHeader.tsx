import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { MenuIcon } from '../icons/MenuIcon';
import type { AppHeaderProps } from './types';

/**
 * App header: a static `<header>` AppBar (the grid row in `AppShell` pins it) with a menu button followed by
 * the app title as the page's only `<h1>`. Toolbar height comes from the MUI mixins (56px, 48px in narrow
 * landscape, 64px from `sm`).
 *
 * @param props - See {@link AppHeaderProps}.
 * @returns The header banner.
 * @example
 * <AppShell header={<AppHeader onMenuClick={openDrawer} />} />
 */
export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <AppBar component="header" position="static">
      <Toolbar>
        {/* size="large" gives a 48 × 48 hit area (WCAG 2.5.5); flexShrink: 0 keeps it intact on narrow screens. */}
        <IconButton
          edge="start"
          color="inherit"
          size="large"
          aria-label={t('header.menuButton.label')}
          onClick={onMenuClick}
          sx={{ mr: 1, flexShrink: 0 }}
        >
          <MenuIcon />
        </IconButton>
        {/* minWidth: 0 lets the flex item shrink so `noWrap` truncates with an ellipsis. */}
        <Typography variant="h6" component="h1" noWrap sx={{ minWidth: 0 }}>
          {t('app.title')}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
