import type { BicycleInput } from '../bicycle/types';
import { INITIAL_APP_STATE } from '../constants';
import { stubLocalStorage, throwStorageError } from '../persistence/__mocks__/stubLocalStorage';
import { APP_STORAGE_KEY, APP_STORAGE_VERSION } from '../persistence/constants';
import type { PersistedAppState } from '../persistence/types';

const BICYCLE_INPUT: BicycleInput = { name: 'Roadie', company: 'Canyon', model: 'Ultimate', purchased: '2024-05-17' };

/**
 * Starts the app's store again, as a page load does: a new module instance that loads from `localStorage`.
 *
 * @returns The new store.
 */
async function loadStore() {
  vi.resetModules();

  return (await import('../useAppStore')).useAppStore;
}

/**
 * Reads the saved data.
 *
 * @returns The parsed `localStorage` entry, or `null` when there is none.
 */
function readSaved(): { state: PersistedAppState; version: number } | null {
  return JSON.parse(localStorage.getItem(APP_STORAGE_KEY) ?? 'null');
}

/**
 * Reads every backup of unreadable data.
 *
 * @returns The raw backed-up texts.
 */
function readBackups(): Array<string | null> {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(`${APP_STORAGE_KEY}:backup:`))
    .map((key) => localStorage.getItem(key));
}

describe('useAppStore persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts from the initial state without saved data, and logs nothing', async () => {
    const store = await loadStore();

    expect(store.getState()).toMatchObject(INITIAL_APP_STATE);
    expect(localStorage.length).toBe(0);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('restores bicycles, components, and history after a reload', async () => {
    const before = await loadStore();
    const bicycle = before.getState().addBicycle(BICYCLE_INPUT);
    expect(bicycle.ok).toBe(true);
    const [bicycleId] = before.getState().bicycle.allIds;
    const component = before.getState().addComponentToBicycle(bicycleId, { type: 'chain', model: 'CN-M8100' });
    expect(component.ok).toBe(true);
    const [componentId] = before.getState().components.allIds;
    const entry = before
      .getState()
      .addComponentHistoryEntry(componentId, { date: '2026-04-12', installed: '2026-03-01', stretch: 0.25 });
    expect(entry.ok).toBe(true);

    const after = await loadStore();

    expect(after).not.toBe(before);
    expect(after.getState().bicycle).toEqual(before.getState().bicycle);
    expect(after.getState().components).toEqual(before.getState().components);
    expect(after.getState().components.byId[componentId].history).toHaveLength(1);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('keeps editing restored data', async () => {
    (await loadStore()).getState().addBicycle(BICYCLE_INPUT);
    const store = await loadStore();
    const [id] = store.getState().bicycle.allIds;

    expect(store.getState().updateBicycle(id, { name: 'Racer' }).ok).toBe(true);

    expect((await loadStore()).getState().bicycle.byId[id].name).toBe('Racer');
  });

  it('saves domain data only, with the version', async () => {
    const store = await loadStore();
    store.getState().addBicycle(BICYCLE_INPUT);

    expect(readSaved()).toEqual({
      state: { bicycle: store.getState().bicycle, components: store.getState().components },
      version: APP_STORAGE_VERSION,
    });
  });

  it('starts on the home screen with the menu closed after a reload', async () => {
    const before = await loadStore();
    before.getState().addBicycle(BICYCLE_INPUT);
    before.getState().openBicycleDetails(before.getState().bicycle.allIds[0]);
    before.getState().openMenu();

    expect((await loadStore()).getState()).toMatchObject({
      isMenuOpen: false,
      activeScreen: 'home',
      selectedBicycleId: null,
    });
  });

  it('ignores UI state and unknown keys in the saved data', async () => {
    const { bicycle, components } = INITIAL_APP_STATE;
    const state = { bicycle, components, isMenuOpen: true, activeScreen: 'addBicycle', extra: 1 };
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ state, version: APP_STORAGE_VERSION }));

    const store = await loadStore();

    expect(store.getState()).toMatchObject({ isMenuOpen: false, activeScreen: 'home' });
    expect(store.getState()).not.toHaveProperty('extra');
  });

  it('does not write for UI-only updates of restored data', async () => {
    (await loadStore()).getState().addBicycle(BICYCLE_INPUT);
    const store = await loadStore();
    const setItem = vi.fn();
    stubLocalStorage({ setItem });

    store.getState().toggleMenu();
    store.getState().navigateTo('addComponent');

    expect(setItem).not.toHaveBeenCalled();
  });

  it('overwrites the saved data with empty collections on reset', async () => {
    const store = await loadStore();
    store.getState().addBicycle(BICYCLE_INPUT);

    store.getState().reset();

    expect((await loadStore()).getState().bicycle).toEqual(INITIAL_APP_STATE.bicycle);
  });

  it.each([
    ['corrupt JSON', '{"state":{"bicycle":'],
    ['no state', `{"version":${APP_STORAGE_VERSION}}`],
    ['no version', '{"state":{}}'],
    ['an unexpected shape', `{"state":{"bicycle":5},"version":${APP_STORAGE_VERSION}}`],
    ['a newer version', `{"state":{"bicycle":{}},"version":${APP_STORAGE_VERSION + 1}}`],
    ['an unknown older version', '{"state":{"bicycle":{}},"version":0}'],
  ])('starts empty and backs up saved data with %s before overwriting it', async (_label, raw) => {
    localStorage.setItem(APP_STORAGE_KEY, raw);

    const store = await loadStore();

    expect(store.getState()).toMatchObject(INITIAL_APP_STATE);
    expect(readBackups()).toEqual([raw]);
    expect(console.error).toHaveBeenCalledOnce();

    store.getState().addBicycle(BICYCLE_INPUT);
    expect(readSaved()?.state.bicycle.allIds).toHaveLength(1);
    expect(readBackups()).toEqual([raw]);
    expect((await loadStore()).getState().bicycle.allIds).toHaveLength(1);
  });

  it('backs up unreadable data only once when the app restarts without saving', async () => {
    localStorage.setItem(APP_STORAGE_KEY, '{"broken');

    await loadStore();
    await loadStore();

    expect(readBackups()).toEqual(['{"broken']);
  });

  it('does not retry a failed save for UI-only updates', async () => {
    const store = await loadStore();
    const setItem = vi.fn(throwStorageError);
    stubLocalStorage({ setItem });
    store.getState().addBicycle(BICYCLE_INPUT);

    store.getState().toggleMenu();
    store.getState().navigateTo('addComponent');

    expect(setItem).toHaveBeenCalledOnce();
  });

  it('leaves unreadable data untouched when it cannot be backed up', async () => {
    localStorage.setItem(APP_STORAGE_KEY, '{"broken');
    stubLocalStorage({ setItem: throwStorageError });
    const store = await loadStore();
    vi.unstubAllGlobals();

    expect(store.getState().addBicycle(BICYCLE_INPUT).ok).toBe(true);

    expect(localStorage.getItem(APP_STORAGE_KEY)).toBe('{"broken');
  });

  it('keeps actions working in memory when storage is full', async () => {
    const store = await loadStore();
    stubLocalStorage({ setItem: throwStorageError });

    expect(store.getState().addBicycle(BICYCLE_INPUT).ok).toBe(true);

    expect(store.getState().bicycle.allIds).toHaveLength(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('works in memory when storage is blocked', async () => {
    stubLocalStorage({ getItem: throwStorageError, setItem: throwStorageError });

    const store = await loadStore();

    expect(store.getState().addBicycle(BICYCLE_INPUT).ok).toBe(true);
    expect(store.getState().bicycle.allIds).toHaveLength(1);
    expect(console.error).toHaveBeenCalled();
  });
});
