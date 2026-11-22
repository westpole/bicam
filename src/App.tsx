import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@store/useAppStore';
import { AppHeader } from '@ui/components/AppHeader/AppHeader';
import { AppMenu } from '@ui/components/AppMenu/AppMenu';
import { APP_MENU_ID } from '@ui/components/AppMenu/constants';
import { AppShell } from '@ui/components/AppShell/AppShell';
import { SCREEN_COMPONENTS } from '@ui/components/screens/constants';
import { Home } from '@ui/components/screens/Home/Home';

/**
 * Root application view: the app shell with its header, the app menu in the shell's overlay slot, and the active
 * screen in the main viewport (on `home`, the user's bicycles as cards; empty when there are none).
 *
 * `App` is the only component that reads `useAppStore`; it passes state and actions down as props, so the header,
 * menu, and screens stay presentational.
 *
 * @returns The app shell.
 */
export function App() {
  const { t } = useTranslation();
  const title = t('app.title');
  const isMenuOpen = useAppStore((state) => state.isMenuOpen);
  const activeScreen = useAppStore((state) => state.activeScreen);
  const bicycleCollection = useAppStore((state) => state.bicycle);
  const toggleMenu = useAppStore((state) => state.toggleMenu);
  const closeMenu = useAppStore((state) => state.closeMenu);
  const navigateTo = useAppStore((state) => state.navigateTo);

  // Select the whole slice (a stable reference until it changes) and map it here, so the selector never returns a
  // new array on each call.
  const bicycles = useMemo(
    () => bicycleCollection.allIds.map((id) => bicycleCollection.byId[id]),
    [bicycleCollection],
  );

  useEffect(() => {
    document.title = title;
  }, [title]);

  const ActiveScreen = activeScreen === 'home' ? null : SCREEN_COMPONENTS[activeScreen];

  return (
    <AppShell
      header={<AppHeader menuOpen={isMenuOpen} menuId={APP_MENU_ID} onMenuClick={toggleMenu} />}
      overlay={<AppMenu open={isMenuOpen} activeScreen={activeScreen} onSelect={navigateTo} onClose={closeMenu} />}
      overlayOpen={isMenuOpen}
    >
      {ActiveScreen ? <ActiveScreen /> : <Home bicycles={bicycles} />}
    </AppShell>
  );
}
