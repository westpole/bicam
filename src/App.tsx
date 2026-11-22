import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@store/useAppStore';
import { AppHeader } from '@ui/components/AppHeader/AppHeader';
import { AppMenu } from '@ui/components/AppMenu/AppMenu';
import { APP_MENU_ID } from '@ui/components/AppMenu/constants';
import { AppShell } from '@ui/components/AppShell/AppShell';
import { SCREEN_COMPONENTS } from '@ui/components/screens/constants';

/**
 * Root application view: the app shell with its header, the app menu in the shell's overlay slot, and the active
 * screen in the main viewport (empty on `home`).
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
  const toggleMenu = useAppStore((state) => state.toggleMenu);
  const closeMenu = useAppStore((state) => state.closeMenu);
  const navigateTo = useAppStore((state) => state.navigateTo);

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
      {ActiveScreen && <ActiveScreen />}
    </AppShell>
  );
}
