import type { Bicycle } from '../bicycle/types';
import { storedComponent } from '../components/__mocks__/storedComponent';
import type { BicycleComponent, ComponentUsagePeriod } from '../components/types';
import { INITIAL_APP_STATE } from '../constants';
import { useAppStore } from '../useAppStore';

const BIKE = 'bike-1';
const OTHER_BIKE = 'bike-2';
const TODAY = '2026-11-25';

/**
 * Builds a stored bicycle.
 *
 * @param id - The bicycle id.
 * @param components - The ids it lists.
 * @param odometer - Its odometer in kilometres.
 * @returns The bicycle.
 */
function bicycle(id: string, components: string[], odometer: number): Bicycle {
  return {
    id,
    name: id,
    company: 'Canyon',
    model: 'Grizl',
    purchased: null,
    size: null,
    frameGeometry: null,
    components,
    odometer,
    odometerDate: null,
  };
}

/**
 * Builds an open period on `BIKE` with a readable id.
 *
 * @param id - The period id.
 * @param start - The start reading.
 * @returns The period.
 */
function openPeriod(id: string, start: number): ComponentUsagePeriod {
  return { id, bicycleId: BIKE, start: { date: null, odometer: start }, end: null, replacedPeriodId: null };
}

/**
 * Replaces the store's data: `BIKE` at 1500 km listing `onBike`, an empty `OTHER_BIKE`, and every given component.
 *
 * @param components - The stored components.
 * @param onBike - The ids `BIKE` lists.
 */
function seed(components: BicycleComponent[], onBike: string[]): void {
  useAppStore.setState({
    ...INITIAL_APP_STATE,
    bicycle: {
      byId: { [BIKE]: bicycle(BIKE, onBike, 1500), [OTHER_BIKE]: bicycle(OTHER_BIKE, [], 0) },
      allIds: [BIKE, OTHER_BIKE],
    },
    components: {
      byId: Object.fromEntries(components.map((component) => [component.id, component])),
      allIds: components.map(({ id }) => id),
    },
  });
}

/**
 * Lists the ids that a state's bicycles name but that are not stored, and the components whose open period names a
 * bicycle that does not list them (rule 1).
 *
 * @returns Every broken reference in the current state.
 */
function findBrokenLinks(): string[] {
  const { bicycle: bicycles, components } = useAppStore.getState();
  const broken: string[] = [];

  for (const id of bicycles.allIds) {
    broken.push(...bicycles.byId[id].components.filter((componentId) => !(componentId in components.byId)));
  }

  for (const id of components.allIds) {
    const open = components.byId[id].usage.find(({ end }) => end === null);

    if (open && !bicycles.byId[open.bicycleId].components.includes(id)) {
      broken.push(id);
    }
  }

  return broken;
}

describe('assigning components', () => {
  const chainInUse = storedComponent('chain-a', 'chain', 'CN-M8100', { usage: [openPeriod('period-a', 0)] });
  const spareChain = storedComponent('chain-b', 'chain', 'CN-M8100', { label: 'B' });
  const spareTire = storedComponent('tire', 'tire', 'GP5000');

  beforeEach(() => {
    seed([chainInUse, spareChain, spareTire], [chainInUse.id]);
  });

  describe('assignComponent', () => {
    it('links a spare component without starting it', () => {
      const result = useAppStore.getState().assignComponent(BIKE, spareTire.id);
      const { bicycle: bicycles, components } = useAppStore.getState();

      expect(result).toEqual({ ok: true, component: spareTire });
      expect(bicycles.byId[BIKE].components).toEqual([chainInUse.id, spareTire.id]);
      expect(components.byId[spareTire.id]).toBe(spareTire);
    });

    it('links and starts a component in one update', () => {
      const states: string[][] = [];
      const unsubscribe = useAppStore.subscribe(() => states.push(findBrokenLinks()));

      const result = useAppStore.getState().assignComponent(BIKE, spareTire.id, { date: TODAY, odometer: 1500 });
      unsubscribe();

      if (!result.ok) throw new Error('the assign was rejected');
      expect(states).toEqual([[]]);
      expect(result.component.usage).toEqual([
        {
          id: expect.any(String),
          bicycleId: BIKE,
          start: { date: TODAY, odometer: 1500 },
          end: null,
          replacedPeriodId: null,
        },
      ]);
      expect(useAppStore.getState().components.byId[spareTire.id]).toBe(result.component);
      expect(useAppStore.getState().bicycle.byId[BIKE].components).toEqual([chainInUse.id, spareTire.id]);
    });

    it('replaces the component in use when named', () => {
      const result = useAppStore
        .getState()
        .assignComponent(BIKE, spareChain.id, { date: TODAY, odometer: 1500, replaces: chainInUse.id });
      const { components } = useAppStore.getState();

      if (!result.ok) throw new Error('the assign was rejected');
      expect(result.component.usage[0]).toMatchObject({ start: { odometer: 1500 }, replacedPeriodId: 'period-a' });
      expect(components.byId[chainInUse.id].usage).toEqual([
        { ...chainInUse.usage[0], end: { date: TODAY, odometer: 1500 } },
      ]);
    });

    it('changes nothing when the start fails, and keeps the start fields', () => {
      const before = useAppStore.getState();

      expect(before.assignComponent(BIKE, spareChain.id, { date: TODAY, odometer: 1600 })).toEqual({
        ok: false,
        errors: [
          { field: 'replaces', code: 'required' },
          { field: 'odometer', code: 'outOfRange' },
        ],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it.each([
      ['an unknown bicycle', 'missing', 'chain-b', 'bicycleId', 'notFound'],
      ['an inherited bicycle key', 'toString', 'chain-b', 'bicycleId', 'notFound'],
      ['an unknown component', BIKE, 'missing', 'componentId', 'notFound'],
      ['a component on this bicycle', BIKE, 'chain-a', 'componentId', 'notAllowed'],
      ['a component on another bicycle', OTHER_BIKE, 'chain-a', 'componentId', 'notAllowed'],
    ])('rejects %s alone', (_, bicycleId, componentId, field, code) => {
      const before = useAppStore.getState();

      expect(before.assignComponent(bicycleId, componentId, { date: TODAY, odometer: -1 })).toEqual({
        ok: false,
        errors: [{ field, code }],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it('rejects a retired component', () => {
      seed([{ ...spareTire, retired: { date: TODAY, bicycleId: OTHER_BIKE } }], []);

      expect(useAppStore.getState().assignComponent(BIKE, spareTire.id)).toEqual({
        ok: false,
        errors: [{ field: 'componentId', code: 'notAllowed' }],
      });
    });

    it('rejects a full bicycle', () => {
      const fillers = Array.from({ length: 100 }, (_, index) => storedComponent(`filler-${index}`, 'saddle', 'Argo'));
      seed(
        [...fillers, spareTire],
        fillers.map(({ id }) => id),
      );
      const before = useAppStore.getState();

      expect(before.assignComponent(BIKE, spareTire.id)).toEqual({
        ok: false,
        errors: [{ field: 'components', code: 'tooMany' }],
      });
      expect(useAppStore.getState()).toBe(before);
    });
  });

  describe('addComponentToBicycle with use', () => {
    it('stores, links, and starts a new component in one update', () => {
      const states: string[][] = [];
      const unsubscribe = useAppStore.subscribe(() => states.push(findBrokenLinks()));

      const result = useAppStore
        .getState()
        .addComponentToBicycle(BIKE, { type: 'cassette', model: 'CS-M8100' }, { date: TODAY, odometer: 1500 });
      unsubscribe();

      if (!result.ok) throw new Error('the component was rejected');
      const { bicycle: bicycles, components } = useAppStore.getState();
      expect(states).toEqual([[]]);
      expect(result.component).toMatchObject({ type: 'cassette', usage: [{ start: { date: TODAY, odometer: 1500 } }] });
      expect(components.byId[result.component.id]).toBe(result.component);
      expect(components.allIds).toEqual([chainInUse.id, spareChain.id, spareTire.id, result.component.id]);
      expect(bicycles.byId[BIKE].components).toEqual([chainInUse.id, result.component.id]);
    });

    it('lets a new component replace one in use', () => {
      const result = useAppStore
        .getState()
        .addComponentToBicycle(
          BIKE,
          { type: 'chain', model: 'CN-M8100' },
          { date: TODAY, odometer: 1500, replaces: chainInUse.id },
        );

      expect(result.ok).toBe(true);
      expect(useAppStore.getState().components.byId[chainInUse.id].usage[0].end).toEqual({
        date: TODAY,
        odometer: 1500,
      });
    });

    it('stores nothing when the start fails', () => {
      const before = useAppStore.getState();

      expect(
        before.addComponentToBicycle(BIKE, { type: 'chain', model: 'CN-M8100' }, { date: TODAY, odometer: 1500 }),
      ).toEqual({ ok: false, errors: [{ field: 'replaces', code: 'required' }] });
      expect(useAppStore.getState()).toBe(before);
    });

    it('reports input errors before the start is checked', () => {
      expect(
        useAppStore.getState().addComponentToBicycle(BIKE, { type: 'chain', model: ' ' }, { date: 'x', odometer: 9e9 }),
      ).toEqual({ ok: false, errors: [{ field: 'model', code: 'required' }] });
    });
  });
});
