import type { BicycleInput } from '../bicycle/types';
import { INITIAL_APP_STATE } from '../constants';
import { stubLocalStorage, throwStorageError } from '../persistence/__mocks__/stubLocalStorage';
import { APP_STORAGE_KEY, APP_STORAGE_VERSION } from '../persistence/constants';
import type { PersistedAppState } from '../persistence/types';

const BICYCLE_INPUT: BicycleInput = { name: 'Roadie', company: 'Canyon', model: 'Ultimate', purchased: '2024-05-17' };

/** Data as version 1 saved it: one bicycle with a chain and a cassette, a spare chain, and one history entry. */
const V1_STATE = {
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
        components: ['chain-1', 'cassette-1'],
      },
    },
    allIds: ['bike-1'],
  },
  components: {
    byId: {
      'chain-1': {
        id: 'chain-1',
        type: 'chain',
        model: 'CN-M8100',
        history: [
          {
            id: 'entry-1',
            date: '2026-04-12',
            installed: '2026-03-01',
            distance: 412.5,
            position: null,
            subcomponent: null,
            lubricated: '2026-04-12',
            stretch: 0.25,
          },
        ],
      },
      'cassette-1': { id: 'cassette-1', type: 'cassette', model: 'CS-M8100', history: [] },
      'chain-2': { id: 'chain-2', type: 'chain', model: 'X12', history: [] },
    },
    allIds: ['chain-1', 'cassette-1', 'chain-2'],
  },
};

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
  // Transforms the store's modules once, so the first test's `loadStore` does not run into the timeout on a busy machine.
  beforeAll(async () => {
    await import('../useAppStore');
    localStorage.clear();
  });

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

  it('upgrades version 1 data, keeping everything, and saves it as the current version', async () => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ state: V1_STATE, version: 1 }));

    const store = await loadStore();

    const { bicycle, components } = store.getState();
    expect(bicycle.allIds).toEqual(['bike-1']);
    expect(bicycle.byId['bike-1']).toMatchObject({ components: ['chain-1', 'cassette-1'], odometer: 0 });
    expect(components.allIds).toEqual(['chain-1', 'cassette-1', 'chain-2']);
    expect(components.byId['chain-1']).toMatchObject({
      initialDistance: 412.5,
      usage: [{ bicycleId: 'bike-1', start: { date: null, odometer: 0 }, end: null }],
      history: [{ id: 'entry-1', stretch: 0.25, lubricant: null, cleaned: null }],
    });
    expect(components.byId['cassette-1'].usage).toHaveLength(1);
    expect(components.byId['chain-2'].usage).toEqual([]);
    expect(readSaved()).toEqual({ state: { bicycle, components }, version: APP_STORAGE_VERSION });
    expect(readBackups()).toEqual([]);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('loads upgraded version 1 data with more chains on a bicycle than can be in use', async () => {
    const chains = ['chain-1', 'chain-2', 'chain-3'];
    const state = {
      bicycle: { byId: { 'bike-1': { ...V1_STATE.bicycle.byId['bike-1'], components: chains } }, allIds: ['bike-1'] },
      components: {
        byId: Object.fromEntries(chains.map((id) => [id, { id, type: 'chain', model: 'X12', history: [] }])),
        allIds: chains,
      },
    };
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ state, version: 1 }));

    const { bicycle, components } = (await loadStore()).getState();

    expect(bicycle.byId['bike-1'].components).toEqual(chains);
    expect(chains.map((id) => components.byId[id].usage)).toEqual([[], [], []]);
    expect(readSaved()?.version).toBe(APP_STORAGE_VERSION);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('keeps upgraded data after the next reload', async () => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ state: V1_STATE, version: 1 }));
    const before = (await loadStore()).getState();

    const after = (await loadStore()).getState();

    expect(after.components).toEqual(before.components);
    expect(after.bicycle).toEqual(before.bicycle);
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
    ['version 1 with a broken shape', '{"state":{"bicycle":{"byId":{},"allIds":[]},"components":5},"version":1}'],
    ['version 2 data in the version 1 shape', `{"state":${JSON.stringify(V1_STATE)},"version":2}`],
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
