import { INITIAL_APP_STATE } from '../constants';
import type { AppStoreState } from '../types';
import { useAppStore } from '../useAppStore';

/**
 * Returns the store's data fields only (every non-function value), so a test can compare the whole state strictly.
 *
 * @returns The current store state without its actions.
 */
function getStateData(): Partial<AppStoreState> {
  return Object.fromEntries(
    Object.entries(useAppStore.getState()).filter(([, value]) => typeof value !== 'function'),
  ) as Partial<AppStoreState>;
}

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ ...INITIAL_APP_STATE });
  });

  it('starts with the menu closed on the home screen', () => {
    expect(useAppStore.getState()).toMatchObject({ isMenuOpen: false, activeScreen: 'home' });
  });

  it('starts with an empty bicycle collection and empty placeholder slices', () => {
    expect(INITIAL_APP_STATE).toEqual({
      isMenuOpen: false,
      activeScreen: 'home',
      bicycle: { byId: {}, allIds: [] },
      events: {},
      components: {},
      history: {},
    });
    expect(getStateData()).toEqual(INITIAL_APP_STATE);
  });

  it('keeps the initial state plain JSON', () => {
    expect(JSON.parse(JSON.stringify(INITIAL_APP_STATE))).toEqual(INITIAL_APP_STATE);
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

  it('resets to the initial state, including domain data', () => {
    useAppStore.setState({
      activeScreen: 'addClothesSet',
      isMenuOpen: true,
      bicycle: {
        byId: {
          Roadie: {
            id: 'Roadie',
            company: 'Canyon',
            model: 'Ultimate',
            purchased: null,
            size: null,
            frameGeometry: null,
            components: [],
          },
        },
        allIds: ['Roadie'],
      },
    });

    useAppStore.getState().reset();

    expect(getStateData()).toEqual(INITIAL_APP_STATE);
  });
});
