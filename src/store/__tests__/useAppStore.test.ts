import { linkComponent } from '../bicycle/utilities/linkComponent';
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

  it('starts with empty bicycle and component collections and empty placeholder slices', () => {
    expect(INITIAL_APP_STATE).toEqual({
      isMenuOpen: false,
      activeScreen: 'home',
      selectedBicycleId: null,
      bicycle: { byId: {}, allIds: [] },
      events: {},
      components: { byId: {}, allIds: [] },
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
            odometer: 0,
            odometerDate: null,
          },
        },
        allIds: ['bike-1'],
      },
    });

    useAppStore.getState().reset();

    expect(getStateData()).toEqual(INITIAL_APP_STATE);
  });

  describe('links between bicycles and components', () => {
    /**
     * Adds a component through the store and returns its generated id.
     *
     * @param model - The component model.
     * @returns The new component's id.
     */
    function addComponent(model: string): string {
      const result = useAppStore.getState().addComponent({ type: 'chain', model });
      if (!result.ok) throw new Error('fixture component was rejected');
      return result.component.id;
    }

    /**
     * Adds a bicycle that lists the given components and returns its generated id.
     *
     * @param name - The bicycle name (must be unique).
     * @param components - Ids of stored components.
     * @returns The new bicycle's id.
     */
    function addBicycleWith(name: string, components: string[]): string {
      const result = useAppStore.getState().addBicycle({ name, company: 'Canyon', model: 'Grizl', components });
      if (!result.ok) throw new Error('fixture bicycle was rejected');
      return result.bicycle.id;
    }

    /**
     * Lists the component ids that a bicycle refers to but the store does not hold.
     *
     * @param state - The state to check.
     * @returns The missing ids.
     */
    function findMissingComponents({ bicycle, components }: AppStoreState): string[] {
      return Object.values(bicycle.byId)
        .flatMap((stored) => stored.components)
        .filter((id) => !Object.keys(components.byId).includes(id));
    }

    it('removes a component from every bicycle that lists it', () => {
      const removed = addComponent('Removed');
      const kept = addComponent('Kept');
      const first = addBicycleWith('First', [removed, kept]);
      const second = addBicycleWith('Second', []);
      const other = addBicycleWith('Other', []);
      // The actions never put one component on two bicycles, so seed it directly.
      useAppStore.setState((state) => ({ bicycle: linkComponent(state.bicycle, second, removed) }));
      const before = useAppStore.getState();

      expect(before.removeComponent(removed)).toBe(true);

      const { bicycle, components } = useAppStore.getState();
      expect(bicycle.byId[first]).toEqual({ ...before.bicycle.byId[first], components: [kept] });
      expect(bicycle.byId[second]).toEqual({ ...before.bicycle.byId[second], components: [] });
      expect(bicycle.byId[other]).toBe(before.bicycle.byId[other]);
      expect(bicycle.allIds).toBe(before.bicycle.allIds);
      expect(components.allIds).toEqual([kept]);
      expect(Object.keys(components.byId)).toEqual([kept]);
    });

    it('keeps the bicycle reference when no bicycle lists the component', () => {
      const removed = addComponent('Removed');
      addBicycleWith('Roadie', [addComponent('Kept')]);
      const before = useAppStore.getState();

      expect(before.removeComponent(removed)).toBe(true);

      expect(useAppStore.getState().bicycle).toBe(before.bicycle);
      expect(useAppStore.getState().components.byId[removed]).toBeUndefined();
    });

    it('never shows subscribers a bicycle that lists a missing component', () => {
      const removed = addComponent('Removed');
      addBicycleWith('Roadie', [removed]);
      const missing: string[][] = [];
      const unsubscribe = useAppStore.subscribe((state) => missing.push(findMissingComponents(state)));

      useAppStore.getState().removeComponent(removed);
      unsubscribe();

      expect(missing).toEqual([[], []]);
    });

    it.each(['unknown-id', 'toString', '__proto__'])(
      'returns false and changes nothing when removing the unknown component %j',
      (id) => {
        addBicycleWith('Roadie', [addComponent('Kept')]);
        const before = useAppStore.getState();

        expect(before.removeComponent(id)).toBe(false);
        expect(useAppStore.getState()).toBe(before);
      },
    );

    it('keeps the components of a removed bicycle', () => {
      const id = addBicycleWith('Roadie', [addComponent('Kept')]);
      const before = useAppStore.getState();

      expect(before.removeBicycle(id)).toBe(true);

      expect(useAppStore.getState().components).toBe(before.components);
    });

    it('stores a new component and lists it last on the bicycle', () => {
      const chain = addComponent('CN-M8100');
      const bicycleId = addBicycleWith('Gravel', [chain]);
      const otherId = addBicycleWith('Roadie', []);
      const other = useAppStore.getState().bicycle.byId[otherId];

      const result = useAppStore.getState().addComponentToBicycle(bicycleId, { type: 'saddle', model: ' Argo ' });

      if (!result.ok) throw new Error('the component was rejected');
      expect(result.component).toMatchObject({ type: 'saddle', model: 'Argo', history: [] });
      const { bicycle, components } = useAppStore.getState();
      expect(components.byId[result.component.id]).toBe(result.component);
      expect(bicycle.byId[bicycleId].components).toEqual([chain, result.component.id]);
      expect(bicycle.byId[otherId]).toBe(other);
    });

    it('never shows subscribers a missing component while a new one is added to a bicycle', () => {
      const bicycleId = addBicycleWith('Gravel', []);
      const missing: string[][] = [];
      const unsubscribe = useAppStore.subscribe((state) => missing.push(findMissingComponents(state)));

      useAppStore.getState().addComponentToBicycle(bicycleId, { type: 'saddle', model: 'Argo' });
      unsubscribe();

      expect(missing).toEqual([[], []]);
    });

    it('rejects an invalid new component for a bicycle without changing state', () => {
      const bicycleId = addBicycleWith('Gravel', []);
      const before = useAppStore.getState();

      expect(before.addComponentToBicycle(bicycleId, { type: 'motor', model: ' ' })).toEqual({
        ok: false,
        errors: [
          { field: 'type', code: 'invalidOption' },
          { field: 'model', code: 'required' },
        ],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it.each(['missing-id', 'toString'])('rejects a new component for the unknown bicycle %j, before its input', (id) => {
      const before = useAppStore.getState();

      expect(before.addComponentToBicycle(id, { type: '', model: '' })).toEqual({
        ok: false,
        errors: [{ field: 'bicycleId', code: 'notFound' }],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it('rejects a new component for a full bicycle, before its input, and stores nothing', () => {
      const ids = Array.from({ length: 100 }, (_, index) => addComponent(`Chain ${index}`));
      const bicycleId = addBicycleWith('Gravel', ids);
      const before = useAppStore.getState();

      expect(before.addComponentToBicycle(bicycleId, { type: '', model: '' })).toEqual({
        ok: false,
        errors: [{ field: 'components', code: 'tooMany' }],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it('can update a bicycle after one of its components was removed', () => {
      const removed = addComponent('Removed');
      const id = addBicycleWith('Roadie', [removed]);
      useAppStore.getState().removeComponent(removed);

      expect(useAppStore.getState().updateBicycle(id, { model: 'Ultimate' })).toMatchObject({
        ok: true,
        bicycle: { model: 'Ultimate', components: [] },
      });
    });
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
