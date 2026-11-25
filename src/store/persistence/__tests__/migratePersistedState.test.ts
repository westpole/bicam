import type { BicycleComponentType } from '../../components/types';
import { APP_STORAGE_VERSION } from '../constants';
import type { BicycleComponentV1, BicycleV1, ComponentHistoryEntryV1, PersistedAppStateV1 } from '../types';
import { isPersistedAppState } from '../utilities/isPersistedAppState';
import { migratePersistedState } from '../utilities/migratePersistedState';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const CHAIN_LIMITS = {
  distance: null,
  stretch: 0.5,
  lubrication: 300,
  cleaning: 1500,
};
const EMPTY_LIMITS = {
  distance: null,
  stretch: null,
  lubrication: null,
  cleaning: null,
};

/**
 * Builds a version 1 bicycle.
 *
 * @param id - The bicycle id.
 * @param components - Ids of its components.
 * @returns The bicycle as version 1 saved it.
 */
function bicycleV1(id: string, components: string[]): BicycleV1 {
  return {
    id,
    name: id,
    company: 'Canyon',
    model: 'Grizl',
    purchased: '2024-05-17',
    size: 'M',
    frameGeometry: null,
    components,
  };
}

/**
 * Builds a version 1 component.
 *
 * @param id - The component id.
 * @param type - The component type.
 * @param history - Its history entries.
 * @returns The component as version 1 saved it.
 */
function componentV1(
  id: string,
  type: BicycleComponentType,
  history: ComponentHistoryEntryV1[] = [],
): BicycleComponentV1 {
  return { id, type, model: `Model ${id}`, history };
}

/**
 * Builds a version 1 history entry.
 *
 * @param id - The entry id.
 * @param overrides - Fields to replace.
 * @returns The entry as version 1 saved it.
 */
function entryV1(id: string, overrides: Partial<ComponentHistoryEntryV1> = {}): ComponentHistoryEntryV1 {
  return {
    id,
    date: '2026-04-12',
    installed: '2026-03-01',
    distance: null,
    position: null,
    subcomponent: null,
    lubricated: null,
    stretch: null,
    ...overrides,
  };
}

/**
 * Builds version 1 data, keeping the list orders.
 *
 * @param bicycles - Bicycles in display order.
 * @param components - Components in display order.
 * @returns The saved data.
 */
function stateV1(bicycles: BicycleV1[], components: BicycleComponentV1[]): PersistedAppStateV1 {
  return {
    bicycle: {
      byId: Object.fromEntries(bicycles.map((b) => [b.id, b])),
      allIds: bicycles.map(({ id }) => id),
    },
    components: {
      byId: Object.fromEntries(components.map((c) => [c.id, c])),
      allIds: components.map(({ id }) => id),
    },
  };
}

/**
 * Migrates version 1 data and checks that the result is loadable version 2 data.
 *
 * @param state - Version 1 data.
 * @returns The migrated data.
 */
function migrate(state: PersistedAppStateV1) {
  const migrated = migratePersistedState(JSON.parse(JSON.stringify(state)), 1);

  expect(isPersistedAppState(migrated)).toBe(true);

  return migrated;
}

/**
 * Lists the bicycle each component is in use on after a migration.
 *
 * @param state - Version 1 data.
 * @returns The bicycle id of each component's open period, or `null`, keyed by component id.
 */
function inUseOn(state: PersistedAppStateV1): Record<string, string | null> {
  const { components } = migrate(state);

  return Object.fromEntries(
    components.allIds.map((id) => [id, components.byId[id].usage.find(({ end }) => end === null)?.bicycleId ?? null]),
  );
}

describe('migratePersistedState', () => {
  it('migrates to the current version', () => {
    expect(APP_STORAGE_VERSION).toBe(2);
  });

  describe('from version 1', () => {
    it('keeps an empty app empty', () => {
      const empty = stateV1([], []);

      expect(migrate(empty)).toEqual(empty);
    });

    it('adds the odometer to bicycles and keeps their fields and order', () => {
      const state = stateV1([bicycleV1('bike-b', []), bicycleV1('bike-a', [])], []);

      const { bicycle } = migrate(state);

      expect(bicycle.allIds).toEqual(['bike-b', 'bike-a']);
      expect(bicycle.byId['bike-b']).toEqual({
        ...bicycleV1('bike-b', []),
        odometer: 0,
        odometerDate: null,
      });
    });

    it('puts one chain in use at odometer 0 on an unknown date', () => {
      const state = stateV1([bicycleV1('bike-1', ['chain-1'])], [componentV1('chain-1', 'chain')]);

      const chain = migrate(state).components.byId['chain-1'];

      expect(chain).toEqual({
        id: 'chain-1',
        type: 'chain',
        model: 'Model chain-1',
        label: null,
        initialDistance: 0,
        limits: CHAIN_LIMITS,
        usage: [
          {
            id: expect.stringMatching(UUID_PATTERN),
            bicycleId: 'bike-1',
            start: { date: null, odometer: 0 },
            end: null,
            replacedPeriodId: null,
          },
        ],
        retired: null,
        history: [],
      });
    });

    it('gives other types empty limits', () => {
      const state = stateV1([], [componentV1('tire-1', 'tire')]);

      expect(migrate(state).components.byId['tire-1'].limits).toEqual(EMPTY_LIMITS);
    });

    it('puts none of three chains in use, because the app cannot know which one is fitted', () => {
      const chains = ['chain-1', 'chain-2', 'chain-3'];
      const state = stateV1(
        [bicycleV1('bike-1', [...chains, 'cassette-1'])],
        [...chains.map((id) => componentV1(id, 'chain')), componentV1('cassette-1', 'cassette')],
      );

      expect(inUseOn(state)).toEqual({
        'chain-1': null,
        'chain-2': null,
        'chain-3': null,
        'cassette-1': 'bike-1',
      });
    });

    it('puts two tires in use, because two fit', () => {
      const state = stateV1(
        [bicycleV1('bike-1', ['tire-1', 'tire-2'])],
        [componentV1('tire-1', 'tire'), componentV1('tire-2', 'tire')],
      );

      expect(inUseOn(state)).toEqual({
        'tire-1': 'bike-1',
        'tire-2': 'bike-1',
      });
    });

    it('puts none of three tires in use', () => {
      const tires = ['tire-1', 'tire-2', 'tire-3'];
      const state = stateV1(
        [bicycleV1('bike-1', tires)],
        tires.map((id) => componentV1(id, 'tire')),
      );

      expect(inUseOn(state)).toEqual({
        'tire-1': null,
        'tire-2': null,
        'tire-3': null,
      });
    });

    it('puts any number of front mounts in use', () => {
      const mounts = ['mount-1', 'mount-2', 'mount-3'];
      const state = stateV1(
        [bicycleV1('bike-1', mounts)],
        mounts.map((id) => componentV1(id, 'frontMount')),
      );

      expect(inUseOn(state)).toEqual({
        'mount-1': 'bike-1',
        'mount-2': 'bike-1',
        'mount-3': 'bike-1',
      });
    });

    it('counts each bicycle on its own', () => {
      const state = stateV1(
        [bicycleV1('bike-1', ['chain-1']), bicycleV1('bike-2', ['chain-2', 'chain-3'])],
        [componentV1('chain-1', 'chain'), componentV1('chain-2', 'chain'), componentV1('chain-3', 'chain')],
      );

      expect(inUseOn(state)).toEqual({
        'chain-1': 'bike-1',
        'chain-2': null,
        'chain-3': null,
      });
    });

    it('gives a spare component no usage', () => {
      const state = stateV1([bicycleV1('bike-1', [])], [componentV1('chain-1', 'chain')]);

      expect(migrate(state).components.byId['chain-1'].usage).toEqual([]);
    });

    it('counts a component that a bicycle lists twice only once', () => {
      const state = stateV1(
        [bicycleV1('bike-1', ['tire-1', 'tire-1', 'tire-2'])],
        [componentV1('tire-1', 'tire'), componentV1('tire-2', 'tire')],
      );

      expect(inUseOn(state)).toEqual({ 'tire-1': 'bike-1', 'tire-2': 'bike-1' });
    });

    it('does not count a component started on an earlier bicycle on a later one', () => {
      const state = stateV1(
        [bicycleV1('bike-1', ['chain-1']), bicycleV1('bike-2', ['chain-1', 'chain-2'])],
        [componentV1('chain-1', 'chain'), componentV1('chain-2', 'chain')],
      );

      expect(inUseOn(state)).toEqual({ 'chain-1': 'bike-1', 'chain-2': 'bike-2' });
    });

    it('starts a component that two bicycles list on the first one only', () => {
      const state = stateV1(
        [bicycleV1('bike-1', ['chain-1']), bicycleV1('bike-2', ['chain-1'])],
        [componentV1('chain-1', 'chain')],
      );

      const { bicycle, components } = migrate(state);

      expect(components.byId['chain-1'].usage).toEqual([expect.objectContaining({ bicycleId: 'bike-1', end: null })]);
      expect(bicycle.byId['bike-2'].components).toEqual(['chain-1']);
    });

    it('gives every period its own id', () => {
      const state = stateV1(
        [bicycleV1('bike-1', ['chain-1', 'cassette-1'])],
        [componentV1('chain-1', 'chain'), componentV1('cassette-1', 'cassette')],
      );

      const { components } = migrate(state);

      expect(components.byId['chain-1'].usage[0].id).not.toBe(components.byId['cassette-1'].usage[0].id);
    });

    it('keeps every history entry, in order, with lubricant and cleaned unknown', () => {
      const history = [
        entryV1('entry-2', { lubricated: '2026-04-01', stretch: 0.25 }),
        entryV1('entry-1', { date: '2026-03-01' }),
      ];
      const state = stateV1([], [componentV1('chain-1', 'chain', history)]);

      expect(migrate(state).components.byId['chain-1'].history).toEqual(
        history.map((entry) => ({ ...entry, lubricant: null, cleaned: null })),
      );
    });

    it('keeps the component order', () => {
      const state = stateV1([], [componentV1('saddle-1', 'saddle'), componentV1('chain-1', 'chain')]);

      expect(migrate(state).components.allIds).toEqual(['saddle-1', 'chain-1']);
    });

    describe('initialDistance', () => {
      it.each<[string, ComponentHistoryEntryV1[], number]>([
        ['no history', [], 0],
        ['no entry with a distance', [entryV1('entry-1')], 0],
        [
          'the entry with the latest date',
          [entryV1('entry-1', { date: '2026-05-01', distance: 300 }), entryV1('entry-2', { distance: 100 })],
          300,
        ],
        [
          'the last added entry on equal dates',
          [entryV1('entry-1', { distance: 100 }), entryV1('entry-2', { distance: 200 })],
          200,
        ],
        [
          'a newer entry without a distance is skipped',
          [entryV1('entry-1', { distance: 150 }), entryV1('entry-2', { date: '2026-06-01' })],
          150,
        ],
        [
          'subcomponent entries are ignored',
          [
            entryV1('entry-1', { date: '2026-01-01', distance: 50 }),
            entryV1('entry-2', {
              date: '2026-06-01',
              distance: 900,
              subcomponent: 'rim',
            }),
          ],
          50,
        ],
        ['only subcomponent entries', [entryV1('entry-1', { distance: 900, subcomponent: 'hub' })], 0],
      ])('with %s', (_label, history, expected) => {
        const state = stateV1([], [componentV1('wheel-1', 'wheel', history)]);

        expect(migrate(state).components.byId['wheel-1'].initialDistance).toBe(expected);
      });
    });

    it('does not mutate its input', () => {
      const state = stateV1([bicycleV1('bike-1', ['chain-1'])], [componentV1('chain-1', 'chain', [entryV1('e-1')])]);
      const copy = structuredClone(state);

      migratePersistedState(state, 1);

      expect(state).toEqual(copy);
    });

    it.each([
      ['not an object', 5],
      ['no components', { bicycle: { byId: {}, allIds: [] } }],
      ['a bicycle listing a missing component', stateV1([bicycleV1('bike-1', ['chain-1'])], [])],
      [
        'an unknown type',
        stateV1(
          [],
          [
            {
              ...componentV1('x-1', 'chain'),
              type: 'engine' as BicycleComponentType,
            },
          ],
        ),
      ],
      ['a broken history entry', stateV1([], [componentV1('chain-1', 'chain', [{ ...entryV1('e-1'), date: 'x' }])])],
    ])('throws for version 1 data with %s', (_label, value) => {
      expect(() => migratePersistedState(value, 1)).toThrow('version 1 has an unexpected shape');
    });
  });

  it.each([0, 2, 3, 1.5, -1])('throws for version %s', (version) => {
    expect(() => migratePersistedState(stateV1([], []), version)).toThrow(`from version ${version} to 2`);
  });
});
