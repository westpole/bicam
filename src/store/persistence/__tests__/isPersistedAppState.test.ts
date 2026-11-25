import type { Bicycle } from '../../bicycle/types';
import { COMPONENT_TYPES, SUBCOMPONENTS } from '../../components/constants';
import type { BicycleComponent, ComponentHistoryEntry, ComponentUsagePeriod } from '../../components/types';
import { isPersistedAppState } from '../utilities/isPersistedAppState';

const BICYCLE: Bicycle = {
  id: 'bike-1',
  name: 'Roadie',
  company: 'Canyon',
  model: 'Ultimate',
  purchased: '2024-05-17',
  size: 'M/L',
  frameGeometry: 'Stack 594',
  components: ['chain-1'],
  odometer: 1500,
  odometerDate: '2026-04-12',
};

const ENTRY: ComponentHistoryEntry = {
  id: 'entry-1',
  date: '2026-04-12',
  installed: '2026-03-01',
  distance: 412.5,
  position: 'front',
  subcomponent: 'hub',
  lubricated: '2026-04-01',
  stretch: 0.5,
  lubricant: 'wax',
  cleaned: '2026-04-01',
};

const OPEN_PERIOD: ComponentUsagePeriod = {
  id: 'period-2',
  bicycleId: 'bike-1',
  start: { date: '2026-04-01', odometer: 1000 },
  end: null,
  replacedPeriodId: 'period-of-another-chain',
};

const CLOSED_PERIOD: ComponentUsagePeriod = {
  id: 'period-1',
  bicycleId: 'bike-1',
  start: { date: null, odometer: 0 },
  end: { date: '2026-03-01', odometer: 500 },
  replacedPeriodId: null,
};

const COMPONENT: BicycleComponent = {
  id: 'chain-1',
  type: 'chain',
  model: 'CN-M8100',
  label: 'A',
  initialDistance: 120.5,
  limits: { distance: 5000, stretch: 0.5, lubrication: 300, cleaning: 1500 },
  usage: [CLOSED_PERIOD, OPEN_PERIOD],
  retired: null,
  history: [ENTRY],
};

/** A second component that no bicycle lists. */
const SPARE: BicycleComponent = {
  ...COMPONENT,
  id: 'chain-2',
  usage: [],
  history: [],
};

/**
 * Builds saved data with one bicycle that lists one component, plus a spare component.
 *
 * @param overrides - Fields to replace on the bicycle, the listed component, the spare component, the listed
 * component's open period, or its history entry, with any value.
 * @returns The untrusted data.
 */
function makeState(
  overrides: {
    bicycle?: Record<string, unknown>;
    component?: Record<string, unknown>;
    spare?: Record<string, unknown>;
    period?: Record<string, unknown>;
    entry?: Record<string, unknown>;
  } = {},
): unknown {
  const entry = { ...ENTRY, ...overrides.entry };
  const period = { ...OPEN_PERIOD, ...overrides.period };

  return {
    bicycle: {
      byId: { 'bike-1': { ...BICYCLE, ...overrides.bicycle } },
      allIds: ['bike-1'],
    },
    components: {
      byId: {
        'chain-1': {
          ...COMPONENT,
          usage: [CLOSED_PERIOD, period],
          history: [entry],
          ...overrides.component,
        },
        'chain-2': { ...SPARE, ...overrides.spare },
      },
      allIds: ['chain-1', 'chain-2'],
    },
  };
}

describe('isPersistedAppState', () => {
  it('accepts empty collections', () => {
    const empty = { byId: {}, allIds: [] };

    expect(isPersistedAppState({ bicycle: empty, components: empty })).toBe(true);
  });

  it('accepts complete data', () => {
    expect(isPersistedAppState(makeState())).toBe(true);
  });

  it('accepts null in every optional field', () => {
    const state = makeState({
      bicycle: {
        purchased: null,
        size: null,
        frameGeometry: null,
        odometerDate: null,
      },
      component: {
        label: null,
        limits: {
          distance: null,
          stretch: null,
          lubrication: null,
          cleaning: null,
        },
        usage: [],
        retired: null,
      },
      entry: {
        distance: null,
        position: null,
        subcomponent: null,
        lubricated: null,
        stretch: null,
        lubricant: null,
        cleaned: null,
      },
    });

    expect(isPersistedAppState(state)).toBe(true);
  });

  it('accepts a retired component', () => {
    const state = makeState({
      bicycle: { components: [] },
      component: {
        usage: [CLOSED_PERIOD],
        retired: { date: '2026-05-01', bicycleId: 'bike-1' },
      },
    });

    expect(isPersistedAppState(state)).toBe(true);
  });

  it.each(COMPONENT_TYPES)('accepts the component type %s', (type) => {
    expect(isPersistedAppState(makeState({ component: { type } }))).toBe(true);
  });

  it.each(Object.values(SUBCOMPONENTS).flat())('accepts the subcomponent %s', (subcomponent) => {
    expect(isPersistedAppState(makeState({ entry: { subcomponent } }))).toBe(true);
  });

  it.each(['oil', 'wax'])('accepts the lubricant %s', (lubricant) => {
    expect(isPersistedAppState(makeState({ entry: { lubricant } }))).toBe(true);
  });

  describe('accepts data that later rules may reject, so tightening a rule keeps saved data readable', () => {
    it('values over the field limits', () => {
      const state = makeState({
        bicycle: { name: 'x'.repeat(1000), size: 'X*L', odometer: -5 },
        component: {
          model: 'x'.repeat(1000),
          label: '',
          initialDistance: 9_999_999.123,
          limits: {
            distance: 0,
            stretch: 99,
            lubrication: -1,
            cleaning: 0.123,
          },
        },
        entry: { distance: 9_999_999.123, stretch: 99 },
      });

      expect(isPersistedAppState(state)).toBe(true);
    });

    it('chain-only limits and chain care on another type', () => {
      const state = makeState({
        component: { type: 'tire' },
        entry: { lubricant: 'oil' },
      });

      expect(isPersistedAppState(state)).toBe(true);
    });

    it('more open periods of one type on a bicycle than ACTIVE_LIMITS allows', () => {
      const second = {
        ...COMPONENT,
        id: 'chain-3',
        usage: [{ ...OPEN_PERIOD, id: 'period-3' }],
      };
      const state = {
        bicycle: {
          byId: {
            'bike-1': { ...BICYCLE, components: ['chain-1', 'chain-3'] },
          },
          allIds: ['bike-1'],
        },
        components: {
          byId: { 'chain-1': COMPONENT, 'chain-3': second },
          allIds: ['chain-1', 'chain-3'],
        },
      };

      expect(isPersistedAppState(state)).toBe(true);
    });

    it('overlapping periods and readings past the odometer', () => {
      const overlapping = {
        ...CLOSED_PERIOD,
        end: { date: null, odometer: 99_999 },
      };

      expect(isPersistedAppState(makeState({ component: { usage: [overlapping, OPEN_PERIOD] } }))).toBe(true);
    });
  });

  describe('does not look up references to things that may have been removed', () => {
    it('an unknown replacedPeriodId', () => {
      expect(isPersistedAppState(makeState({ period: { replacedPeriodId: 'removed-period' } }))).toBe(true);
    });

    it('a removed bicycle in a closed period', () => {
      const closed = { ...CLOSED_PERIOD, bicycleId: 'removed-bike' };

      expect(isPersistedAppState(makeState({ component: { usage: [closed, OPEN_PERIOD] } }))).toBe(true);
    });

    it('a removed bicycle in retired', () => {
      const state = makeState({
        bicycle: { components: [] },
        component: {
          usage: [],
          retired: { date: '2026-05-01', bicycleId: 'removed-bike' },
        },
      });

      expect(isPersistedAppState(state)).toBe(true);
    });
  });

  it.each([undefined, null, 5, 'state', [], {}])('rejects %j', (value) => {
    expect(isPersistedAppState(value)).toBe(false);
  });

  it.each([
    ['missing', undefined],
    ['a list', []],
    ['without byId', { allIds: [] }],
    ['with an unknown id in allIds', { byId: {}, allIds: ['bike-1'] }],
    [
      'with a repeated id',
      {
        byId: { 'bike-1': { ...BICYCLE, components: [] } },
        allIds: ['bike-1', 'bike-1'],
      },
    ],
    ['with an inherited key', { byId: {}, allIds: ['toString'] }],
  ])('rejects a collection %s', (_label, collection) => {
    const empty = { byId: {}, allIds: [] };

    expect(isPersistedAppState({ bicycle: collection, components: empty })).toBe(false);
    expect(isPersistedAppState({ bicycle: empty, components: collection })).toBe(false);
  });

  it.each([
    ['name', undefined],
    ['purchased', '2024-02-30'],
    ['components', ['missing']],
    ['components', ['toString']],
    ['odometer', undefined],
    ['odometer', '1500'],
    ['odometerDate', undefined],
    ['odometerDate', '2026-13-01'],
  ])('rejects a bicycle with %s %j', (field, value) => {
    expect(isPersistedAppState(makeState({ bicycle: { [field]: value } }))).toBe(false);
  });

  it.each([
    ['type', 'engine'],
    ['model', null],
    ['label', undefined],
    ['label', 5],
    ['initialDistance', undefined],
    ['initialDistance', null],
    ['limits', undefined],
    ['limits', null],
    ['limits', { distance: null, stretch: null, lubrication: null }],
    ['limits', { distance: '5000', stretch: null, lubrication: null, cleaning: null }],
    ['usage', undefined],
    ['usage', [null]],
    ['retired', undefined],
    ['retired', '2026-05-01'],
    ['retired', { date: '2026-05-01' }],
    ['retired', { date: 'yesterday', bicycleId: 'bike-1' }],
    ['history', [null]],
  ])('rejects a component with %s %j', (field, value) => {
    expect(isPersistedAppState(makeState({ component: { [field]: value } }))).toBe(false);
  });

  it.each([
    ['id', undefined],
    ['bicycleId', 5],
    ['start', null],
    ['start', { date: null }],
    ['start', { date: '2026-02-30', odometer: 0 }],
    ['end', undefined],
    ['end', { date: null, odometer: '500' }],
    ['replacedPeriodId', undefined],
    ['replacedPeriodId', 5],
  ])('rejects a usage period with %s %j', (field, value) => {
    expect(isPersistedAppState(makeState({ period: { [field]: value } }))).toBe(false);
  });

  it.each([
    ['date', 'yesterday'],
    ['position', 'middle'],
    ['lubricant', undefined],
    ['lubricant', 'grease'],
    ['cleaned', undefined],
    ['cleaned', '2026-04-31'],
  ])('rejects a history entry with %s %j', (field, value) => {
    expect(isPersistedAppState(makeState({ entry: { [field]: value } }))).toBe(false);
  });

  describe('rule 1: at most one open period, on a bicycle that lists the component', () => {
    it('rejects two open periods', () => {
      const second = { ...OPEN_PERIOD, id: 'period-3' };

      expect(isPersistedAppState(makeState({ component: { usage: [OPEN_PERIOD, second] } }))).toBe(false);
    });

    it('rejects an open period on an unknown bicycle', () => {
      expect(isPersistedAppState(makeState({ period: { bicycleId: 'removed-bike' } }))).toBe(false);
    });

    it('rejects an open period on an inherited key', () => {
      expect(isPersistedAppState(makeState({ period: { bicycleId: 'toString' } }))).toBe(false);
    });

    it('rejects an open period on a bicycle that does not list the component', () => {
      expect(isPersistedAppState(makeState({ bicycle: { components: [] } }))).toBe(false);
    });

    it('rejects an open period on a spare component', () => {
      expect(isPersistedAppState(makeState({ spare: { usage: [{ ...OPEN_PERIOD, id: 'period-3' }] } }))).toBe(false);
    });
  });
});
