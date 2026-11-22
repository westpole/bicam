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
      selectedBicycleId: null,
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
      activeScreen: 'bicycleDetails',
      selectedBicycleId: 'bike-1',
      isMenuOpen: true,
      bicycle: {
        byId: {
          'bike-1': {
            id: 'bike-1',
            name: 'Roadie',
            company: 'Canyon',
            model: 'Ultimate',
            purchased: null,
            size: null,
            frameGeometry: null,
            components: [],
          },
        },
        allIds: ['bike-1'],
      },
    });

    useAppStore.getState().reset();

    expect(getStateData()).toEqual(INITIAL_APP_STATE);
  });

  describe('selected bicycle', () => {
    /**
     * Adds a bicycle through the store and returns its generated id.
     *
     * @param name - The bicycle name (must be unique).
     * @returns The new bicycle's id.
     */
    function addBicycle(name: string): string {
      const result = useAppStore.getState().addBicycle({ name, company: 'Canyon', model: 'Grizl' });
      if (!result.ok) throw new Error('fixture bicycle was rejected');
      return result.bicycle.id;
    }

    it('starts with no bicycle selected', () => {
      expect(useAppStore.getState().selectedBicycleId).toBeNull();
    });

    it('opens the details screen for a stored bicycle and closes the menu in one update', () => {
      const id = addBicycle('Roadie');
      useAppStore.getState().openMenu();
      const states: Array<Pick<AppStoreState, 'activeScreen' | 'selectedBicycleId' | 'isMenuOpen'>> = [];
      const unsubscribe = useAppStore.subscribe(({ activeScreen, selectedBicycleId, isMenuOpen }) =>
        states.push({ activeScreen, selectedBicycleId, isMenuOpen }),
      );

      const opened = useAppStore.getState().openBicycleDetails(id);
      unsubscribe();

      expect(opened).toBe(true);
      expect(states).toEqual([{ activeScreen: 'bicycleDetails', selectedBicycleId: id, isMenuOpen: false }]);
    });

    it('switches the details screen to another bicycle', () => {
      const first = addBicycle('Roadie');
      const second = addBicycle('Gravel');

      useAppStore.getState().openBicycleDetails(first);
      useAppStore.getState().openBicycleDetails(second);

      expect(useAppStore.getState()).toMatchObject({ activeScreen: 'bicycleDetails', selectedBicycleId: second });
    });

    it.each(['missing-id', 'toString', '__proto__', ''])(
      'returns false and changes nothing for the unknown id %j',
      (id) => {
        addBicycle('Roadie');
        useAppStore.setState({ activeScreen: 'addComponent', isMenuOpen: true });
        const before = useAppStore.getState();

        expect(useAppStore.getState().openBicycleDetails(id)).toBe(false);
        expect(useAppStore.getState()).toBe(before);
      },
    );

    it('clears the selection when navigating to another screen', () => {
      const id = addBicycle('Roadie');
      useAppStore.getState().openBicycleDetails(id);

      useAppStore.getState().navigateTo('addComponent');

      expect(useAppStore.getState()).toMatchObject({ activeScreen: 'addComponent', selectedBicycleId: null });
    });

    it('returns to home with no selection when the shown bicycle is removed', () => {
      const id = addBicycle('Roadie');
      const other = addBicycle('Gravel');
      useAppStore.getState().openBicycleDetails(id);

      expect(useAppStore.getState().removeBicycle(id)).toBe(true);

      expect(useAppStore.getState()).toMatchObject({ activeScreen: 'home', selectedBicycleId: null });
      expect(useAppStore.getState().bicycle.allIds).toEqual([other]);
    });

    it('keeps the selection when a different bicycle is removed', () => {
      const id = addBicycle('Roadie');
      const other = addBicycle('Gravel');
      useAppStore.getState().openBicycleDetails(id);

      expect(useAppStore.getState().removeBicycle(other)).toBe(true);

      expect(useAppStore.getState()).toMatchObject({ activeScreen: 'bicycleDetails', selectedBicycleId: id });
      expect(useAppStore.getState().bicycle.allIds).toEqual([id]);
    });

    it('leaves the screen alone when a bicycle is removed while nothing is selected', () => {
      const id = addBicycle('Roadie');
      useAppStore.getState().navigateTo('addBicycle');

      expect(useAppStore.getState().removeBicycle(id)).toBe(true);

      expect(useAppStore.getState()).toMatchObject({ activeScreen: 'addBicycle', selectedBicycleId: null });
    });

    it('returns false and changes nothing when removing an unknown id while a bicycle is shown', () => {
      const id = addBicycle('Roadie');
      useAppStore.getState().openBicycleDetails(id);
      const before = useAppStore.getState();

      expect(useAppStore.getState().removeBicycle('missing-id')).toBe(false);
      expect(useAppStore.getState()).toBe(before);
    });
  });
});
