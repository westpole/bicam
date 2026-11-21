import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

/**
 * App header: a static `<header>` AppBar (the grid row in `AppShell` pins it) with the app title as the
 * page's only `<h1>`. Toolbar height comes from the MUI mixins (56px, 48px in narrow landscape, 64px from `sm`).
 *
 * @returns The header banner.
 * @example
 * <AppShell header={<AppHeader />} />
 */
export function AppHeader() {
  const { t } = useTranslation();

  return (
    <AppBar component="header" position="static">
      <Toolbar>
        {/* minWidth: 0 lets the flex item shrink so `noWrap` truncates with an ellipsis. */}
        <Typography variant="h6" component="h1" noWrap sx={{ minWidth: 0 }}>
          {t('app.title')}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
