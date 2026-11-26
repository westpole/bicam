import { useEffect, useMemo } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import type { BicycleInput } from '@store/bicycle/types';
import { getInstalledComponents } from '@store/components/utilities/getInstalledComponents';
import { getMinimumOdometer } from '@store/components/utilities/getMinimumOdometer';
import { getSpareComponents } from '@store/components/utilities/getSpareComponents';
import { useAppStore } from '@store/useAppStore';
import { AppHeader } from '@ui/components/AppHeader/AppHeader';
import { AppMenu } from '@ui/components/AppMenu/AppMenu';
import { APP_MENU_ID } from '@ui/components/AppMenu/constants';
import { AppShell } from '@ui/components/AppShell/AppShell';
import { AddBicycle } from '@ui/components/screens/AddBicycle/AddBicycle';
import { AddComponent } from '@ui/components/screens/AddComponent/AddComponent';
import { BicycleDetails } from '@ui/components/screens/BicycleDetails/BicycleDetails';
import { SCREEN_COMPONENTS } from '@ui/components/screens/constants';
import { Home } from '@ui/components/screens/Home/Home';

/**
 * Root application view: the app shell with its header, the app menu in the shell's overlay slot, and the active
 * screen in the main viewport: on `home`, the user's bicycles as cards (empty when there are none); on
 * `bicycleDetails`, the selected bicycle's details, distance, and components; on `addBicycle`, the new-bicycle form,
 * which returns to `home` when saved or cancelled; on `addComponent`, the spare-component form, which stays open after
 * a save so several parts can be added in a row; otherwise the chosen menu screen. The header title links back to `home`.
 *
 * `App` is the only component that reads `useAppStore`; it passes state and actions down as props, so the header,
 * menu, and screens stay presentational. The light/dark mode is owned by MUI's `ThemeProvider` (it applies the scheme
 * class and saves the choice to `localStorage`), so `App` reads it with `useColorScheme` and hands the header the
 * resolved scheme and a toggle instead of copying it into the store.
 *
 * @returns The app shell.
 */
export function App() {
  const { t } = useTranslation();
  const title = t('app.title');
  const isMenuOpen = useAppStore((state) => state.isMenuOpen);
  const activeScreen = useAppStore((state) => state.activeScreen);
  const bicycleCollection = useAppStore((state) => state.bicycle);
  const componentCollection = useAppStore((state) => state.components);
  const selectedBicycleId = useAppStore((state) => state.selectedBicycleId);
  const toggleMenu = useAppStore((state) => state.toggleMenu);
  const closeMenu = useAppStore((state) => state.closeMenu);
  const navigateTo = useAppStore((state) => state.navigateTo);
  const addBicycle = useAppStore((state) => state.addBicycle);
  const addComponent = useAppStore((state) => state.addComponent);
  const updateBicycle = useAppStore((state) => state.updateBicycle);
  const setBicycleOdometer = useAppStore((state) => state.setBicycleOdometer);
  const addComponentToBicycle = useAppStore((state) => state.addComponentToBicycle);
  const openBicycleDetails = useAppStore((state) => state.openBicycleDetails);
  // `colorScheme` is the resolved scheme (`system` already applied). It is defined from the first render because
  // `main.tsx` (and the Storybook preview) pass `noSsr`; the light fallback only covers rendering without such a
  // ThemeProvider (e.g. unit tests).
  const { colorScheme, setMode } = useColorScheme();
  const shownColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  const toggleColorScheme = () => setMode(shownColorScheme === 'dark' ? 'light' : 'dark');

  // Select the whole slice (a stable reference until it changes) and map it here, so the selector never returns a
  // new array on each call.
  const bicycles = useMemo(
    () => bicycleCollection.allIds.map((id) => bicycleCollection.byId[id]),
    [bicycleCollection],
  );

  // The selection may briefly point at a removed bicycle, so the details screen is only rendered when it resolves.
  const selectedBicycle = selectedBicycleId === null ? undefined : bicycleCollection.byId[selectedBicycleId];

  useEffect(() => {
    document.title = title;
  }, [title]);

  const goHome = () => navigateTo('home');

  // Stays on the form when the store rejects the input, so the form can show the errors.
  const submitBicycle = (input: BicycleInput) => {
    const result = addBicycle(input);

    if (result.ok) {
      goHome();
    }

    return result;
  };

  // `home`, `bicycleDetails`, `addBicycle`, and `addComponent` are rendered below with props.
  const isPropLessScreen =
    activeScreen !== 'home' &&
    activeScreen !== 'bicycleDetails' &&
    activeScreen !== 'addBicycle' &&
    activeScreen !== 'addComponent';
  const ActiveScreen = isPropLessScreen ? SCREEN_COMPONENTS[activeScreen] : null;

  return (
    <AppShell
      header={
        <AppHeader
          menuOpen={isMenuOpen}
          menuId={APP_MENU_ID}
          onMenuClick={toggleMenu}
          onHomeClick={goHome}
          colorScheme={shownColorScheme}
          onColorSchemeToggle={toggleColorScheme}
        />
      }
      overlay={<AppMenu open={isMenuOpen} activeScreen={activeScreen} onSelect={navigateTo} onClose={closeMenu} />}
      overlayOpen={isMenuOpen}
    >
      {ActiveScreen && <ActiveScreen />}
      {activeScreen === 'home' && <Home bicycles={bicycles} onBicycleClick={openBicycleDetails} />}
      {activeScreen === 'addBicycle' && <AddBicycle onSubmit={submitBicycle} onCancel={goHome} />}
      {activeScreen === 'addComponent' && <AddComponent onSubmit={addComponent} onCancel={goHome} />}
      {activeScreen === 'bicycleDetails' && selectedBicycle && (
        <BicycleDetails
          bicycle={selectedBicycle}
          components={getInstalledComponents(componentCollection, selectedBicycle)}
          spareComponents={getSpareComponents(componentCollection, bicycleCollection)}
          minimumOdometer={getMinimumOdometer(componentCollection, selectedBicycle.id)}
          onSetOdometer={(input) => setBicycleOdometer(selectedBicycle.id, input)}
          onCreateComponent={(input) => addComponentToBicycle(selectedBicycle.id, input)}
          onIncludeComponent={(id) =>
            updateBicycle(selectedBicycle.id, { components: [...selectedBicycle.components, id] })
          }
        />
      )}
    </AppShell>
  );
}
