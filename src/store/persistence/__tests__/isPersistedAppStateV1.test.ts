import { COMPONENT_TYPES, SUBCOMPONENTS } from '../../components/constants';
import type { BicycleComponentV1, BicycleV1, ComponentHistoryEntryV1 } from '../types';
import { isPersistedAppStateV1 } from '../utilities/isPersistedAppStateV1';

const BICYCLE: BicycleV1 = {
  id: 'bike-1',
  name: 'Roadie',
  company: 'Canyon',
  model: 'Ultimate',
  purchased: '2024-05-17',
  size: 'M/L',
  frameGeometry: 'Stack 594',
  components: ['chain-1'],
};

const ENTRY: ComponentHistoryEntryV1 = {
  id: 'entry-1',
  date: '2026-04-12',
  installed: '2026-03-01',
  distance: 412.5,
  position: 'front',
  subcomponent: 'hub',
  lubricated: '2026-04-01',
  stretch: 0.5,
};

const COMPONENT: BicycleComponentV1 = { id: 'chain-1', type: 'chain', model: 'CN-M8100', history: [ENTRY] };

/**
 * Builds version 1 data with one bicycle that lists one component.
 *
 * @param overrides - Fields to replace on the bicycle, the component, or its history entry, with any value.
 * @returns The untrusted data.
 */
function makeState(
  overrides: {
    bicycle?: Record<string, unknown>;
    component?: Record<string, unknown>;
    entry?: Record<string, unknown>;
  } = {},
): unknown {
  const entry = { ...ENTRY, ...overrides.entry };

  return {
    bicycle: { byId: { 'bike-1': { ...BICYCLE, ...overrides.bicycle } }, allIds: ['bike-1'] },
    components: {
      byId: { 'chain-1': { ...COMPONENT, history: [entry], ...overrides.component } },
      allIds: ['chain-1'],
    },
  };
}

describe('isPersistedAppStateV1', () => {
  it('accepts empty collections', () => {
    const empty = { byId: {}, allIds: [] };

    expect(isPersistedAppStateV1({ bicycle: empty, components: empty })).toBe(true);
  });

  it('accepts complete data', () => {
    expect(isPersistedAppStateV1(makeState())).toBe(true);
  });

  it('accepts null in every optional field', () => {
    const state = makeState({
      bicycle: { purchased: null, size: null, frameGeometry: null, components: [] },
      entry: { distance: null, position: null, subcomponent: null, lubricated: null, stretch: null },
    });

    expect(isPersistedAppStateV1(state)).toBe(true);
  });

  it.each(COMPONENT_TYPES)('accepts the component type %s', (type) => {
    expect(isPersistedAppStateV1(makeState({ component: { type } }))).toBe(true);
  });

  it.each(Object.values(SUBCOMPONENTS).flat())('accepts the subcomponent %s', (subcomponent) => {
    expect(isPersistedAppStateV1(makeState({ entry: { subcomponent } }))).toBe(true);
  });

  it('accepts values over the field limits, so tightening a limit keeps saved data readable', () => {
    const state = makeState({
      bicycle: { name: 'x'.repeat(1000), size: 'X*L' },
      component: { model: 'x'.repeat(1000) },
      entry: { distance: 9_999_999.123, stretch: 99 },
    });

    expect(isPersistedAppStateV1(state)).toBe(true);
  });

  it.each([undefined, null, 5, 'state', [], {}])('rejects %j', (value) => {
    expect(isPersistedAppStateV1(value)).toBe(false);
  });

  it.each([
    ['missing', undefined],
    ['a list', []],
    ['without byId', { allIds: [] }],
    ['without allIds', { byId: {} }],
    ['with byId as a list', { byId: [], allIds: [] }],
    ['with an unknown id in allIds', { byId: {}, allIds: ['bike-1'] }],
    ['with an id missing from allIds', { byId: { 'bike-1': { ...BICYCLE, components: [] } }, allIds: [] }],
    ['with a repeated id', { byId: { 'bike-1': { ...BICYCLE, components: [] } }, allIds: ['bike-1', 'bike-1'] }],
    ['with mismatched ids', { byId: { 'bike-2': { ...BICYCLE, components: [] } }, allIds: ['bike-2'] }],
    ['with an inherited key', { byId: {}, allIds: ['toString'] }],
    ['with a null entity', { byId: { 'bike-1': null }, allIds: ['bike-1'] }],
  ])('rejects a collection %s', (_label, collection) => {
    const empty = { byId: {}, allIds: [] };

    expect(isPersistedAppStateV1({ bicycle: collection, components: empty })).toBe(false);
    expect(isPersistedAppStateV1({ bicycle: empty, components: collection })).toBe(false);
  });

  it.each([
    ['name', undefined],
    ['company', 5],
    ['model', null],
    ['purchased', undefined],
    ['purchased', 20240517],
    ['purchased', '2024-02-30'],
    ['size', 51],
    ['frameGeometry', {}],
    ['components', null],
    ['components', [5]],
    ['components', ['missing']],
    ['components', ['toString']],
  ])('rejects a bicycle with %s %j', (field, value) => {
    expect(isPersistedAppStateV1(makeState({ bicycle: { [field]: value } }))).toBe(false);
  });

  it.each([
    ['type', undefined],
    ['type', 'engine'],
    ['model', null],
    ['history', undefined],
    ['history', [null]],
  ])('rejects a component with %s %j', (field, value) => {
    expect(isPersistedAppStateV1(makeState({ component: { [field]: value } }))).toBe(false);
  });

  it.each([
    ['id', 5],
    ['date', null],
    ['date', 'yesterday'],
    ['installed', undefined],
    ['installed', '2026-13-01'],
    ['distance', '412'],
    ['position', 'middle'],
    ['subcomponent', 'engine'],
    ['lubricated', 5],
    ['lubricated', 'yesterday'],
    ['stretch', '0.5'],
  ])('rejects a history entry with %s %j', (field, value) => {
    expect(isPersistedAppStateV1(makeState({ entry: { [field]: value } }))).toBe(false);
  });
});
