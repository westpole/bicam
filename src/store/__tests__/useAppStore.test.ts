import { INITIAL_APP_STATE } from '../constants';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ ...INITIAL_APP_STATE });
  });

  it('starts with the menu closed on the home screen', () => {
    expect(useAppStore.getState()).toMatchObject({ isMenuOpen: false, activeScreen: 'home' });
    expect(INITIAL_APP_STATE).toEqual({ isMenuOpen: false, activeScreen: 'home' });
  });

  it('toggles the menu open and closed', () => {
    const { toggleMenu } = useAppStore.getState();

    toggleMenu();
    expect(useAppStore.getState().isMenuOpen).toBe(true);

    toggleMenu();
    expect(useAppStore.getState().isMenuOpen).toBe(false);
  });

  it('opens and closes the menu idempotently', () => {
    const { openMenu, closeMenu } = useAppStore.getState();

    openMenu();
    openMenu();
    expect(useAppStore.getState().isMenuOpen).toBe(true);

    closeMenu();
    closeMenu();
    expect(useAppStore.getState().isMenuOpen).toBe(false);
  });

  it('navigates to a screen and closes the menu in one update', () => {
    useAppStore.getState().openMenu();
    const states: Array<{ isMenuOpen: boolean; activeScreen: string }> = [];
    const unsubscribe = useAppStore.subscribe(({ isMenuOpen, activeScreen }) => states.push({ isMenuOpen, activeScreen }));

    useAppStore.getState().navigateTo('addBicycle');
    unsubscribe();

    expect(states).toEqual([{ isMenuOpen: false, activeScreen: 'addBicycle' }]);
  });

  it('closes the menu when navigating to the already-active screen', () => {
    useAppStore.setState({ activeScreen: 'addComponent', isMenuOpen: true });

    useAppStore.getState().navigateTo('addComponent');

    expect(useAppStore.getState()).toMatchObject({ isMenuOpen: false, activeScreen: 'addComponent' });
  });

  it('keeps the menu closed when navigating while it is closed', () => {
    useAppStore.getState().navigateTo('beforeRideCheckIn');

    expect(useAppStore.getState()).toMatchObject({ isMenuOpen: false, activeScreen: 'beforeRideCheckIn' });
  });

  it('resets to the initial state', () => {
    useAppStore.setState({ activeScreen: 'addClothesSet', isMenuOpen: true });

    useAppStore.getState().reset();

    expect(useAppStore.getState()).toMatchObject(INITIAL_APP_STATE);
  });
});
