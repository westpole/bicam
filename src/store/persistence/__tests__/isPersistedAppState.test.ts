import type { Bicycle } from '../../bicycle/types';
import { COMPONENT_TYPES, SUBCOMPONENTS } from '../../components/constants';
import type { BicycleComponent, ComponentHistoryEntry } from '../../components/types';
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
};

const COMPONENT: BicycleComponent = { id: 'chain-1', type: 'chain', model: 'CN-M8100', history: [ENTRY] };

/**
 * Builds saved data with one bicycle that lists one component.
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
      bicycle: { purchased: null, size: null, frameGeometry: null, components: [] },
      entry: { distance: null, position: null, subcomponent: null, lubricated: null, stretch: null },
    });

    expect(isPersistedAppState(state)).toBe(true);
  });

  it.each(COMPONENT_TYPES)('accepts the component type %s', (type) => {
    expect(isPersistedAppState(makeState({ component: { type } }))).toBe(true);
  });

  it.each(Object.values(SUBCOMPONENTS).flat())('accepts the subcomponent %s', (subcomponent) => {
    expect(isPersistedAppState(makeState({ entry: { subcomponent } }))).toBe(true);
  });

  it('accepts values over the field limits, so tightening a limit keeps saved data readable', () => {
    const state = makeState({
      bicycle: { name: 'x'.repeat(1000), size: 'X*L' },
      component: { model: 'x'.repeat(1000) },
      entry: { distance: 9_999_999.123, stretch: 99 },
    });

    expect(isPersistedAppState(state)).toBe(true);
  });

  it.each([undefined, null, 5, 'state', [], {}])('rejects %j', (value) => {
    expect(isPersistedAppState(value)).toBe(false);
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

    expect(isPersistedAppState({ bicycle: collection, components: empty })).toBe(false);
    expect(isPersistedAppState({ bicycle: empty, components: collection })).toBe(false);
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
    expect(isPersistedAppState(makeState({ bicycle: { [field]: value } }))).toBe(false);
  });

  it.each([
    ['type', undefined],
    ['type', 'engine'],
    ['model', null],
    ['history', undefined],
    ['history', [null]],
  ])('rejects a component with %s %j', (field, value) => {
    expect(isPersistedAppState(makeState({ component: { [field]: value } }))).toBe(false);
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
    expect(isPersistedAppState(makeState({ entry: { [field]: value } }))).toBe(false);
  });
});
