import type { Bicycle } from '../../bicycle/types';
import { INITIAL_APP_STATE } from '../../constants';
import { isPersistedAppState } from '../../persistence/utilities/isPersistedAppState';
import { useAppStore } from '../../useAppStore';
import { storedComponent } from '../__mocks__/storedComponent';
import { COMPONENT_LIMITS } from '../constants';
import type {
  BicycleComponent,
  BicycleComponentType,
  ComponentErrorCode,
  ComponentUsagePeriod,
  ComponentUsageResult,
  ComponentUsageValidationError,
} from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const BIKE = 'bike-1';
const OTHER_BIKE = 'bike-2';

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
 * Builds a usage period with a readable id.
 *
 * @param id - The period id.
 * @param start - The start reading.
 * @param end - The end reading, or `null` while in use.
 * @param options - Other fields.
 * @param options.bicycleId - The bicycle; `BIKE` by default.
 * @param options.replacedPeriodId - What it replaced; `null` by default.
 * @returns The period.
 */
function period(
  id: string,
  start: number,
  end: number | null,
  { bicycleId = BIKE, replacedPeriodId = null }: { bicycleId?: string; replacedPeriodId?: string | null } = {},
): ComponentUsagePeriod {
  return {
    id,
    bicycleId,
    start: { date: null, odometer: start },
    end: end === null ? null : { date: null, odometer: end },
    replacedPeriodId,
  };
}

/** One component to seed: its id, type, and usage periods. */
interface Seed {
  id: string;
  type?: BicycleComponentType;
  usage?: ComponentUsagePeriod[];
  overrides?: Partial<BicycleComponent>;
}

/**
 * Replaces the store's data with one bicycle at `odometer` that lists every seeded component, plus an empty second
 * bicycle.
 *
 * @param odometer - The bicycle's odometer.
 * @param seeds - The components on it.
 */
function seed(odometer: number, seeds: Seed[]): void {
  const components = seeds.map(({ id, type = 'chain', usage = [], overrides }) =>
    storedComponent(id, type, 'Model', { usage, ...overrides }),
  );

  useAppStore.setState({
    ...INITIAL_APP_STATE,
    bicycle: {
      byId: { [BIKE]: bicycle(BIKE, seeds.map(({ id }) => id), odometer), [OTHER_BIKE]: bicycle(OTHER_BIKE, [], 0) },
      allIds: [BIKE, OTHER_BIKE],
    },
    components: {
      byId: Object.fromEntries(components.map((component) => [component.id, component])),
      allIds: components.map(({ id }) => id),
    },
  });
}

/**
 * Starts a component on `BIKE` at a reading with no date.
 *
 * @param componentId - The component.
 * @param odometer - The reading.
 * @param replaces - The replaced component, if any.
 * @returns The action's result.
 */
function start(componentId: string, odometer: number, replaces?: string): ComponentUsageResult {
  return useAppStore.getState().startComponentUse(BIKE, componentId, { date: null, odometer, replaces });
}

/**
 * Sets the bicycle's odometer, failing the test when it is rejected.
 *
 * @param odometer - The new total.
 */
function setOdometer(odometer: number): void {
  expect(useAppStore.getState().setBicycleOdometer(BIKE, { odometer, date: null }).ok).toBe(true);
}

/**
 * Reads a component's periods as `[start, end, replacedPeriodId]`, for short assertions.
 *
 * @param id - The component.
 * @returns One tuple per period, in order.
 */
function readings(id: string): Array<[number, number | null, string | null]> {
  return useAppStore
    .getState()
    .components.byId[id].usage.map(({ start: from, end, replacedPeriodId }) => [
      from.odometer,
      end?.odometer ?? null,
      replacedPeriodId,
    ]);
}

/**
 * Derives a component's distance the way `docs/store/components.md` §2.3 defines it.
 *
 * @param id - The component.
 * @returns Its distance on `BIKE`.
 */
function distance(id: string): number {
  const { bicycle: bicycles, components } = useAppStore.getState();

  return components.byId[id].usage.reduce(
    (sum, { start: from, end }) => sum + (end?.odometer ?? bicycles.byId[BIKE].odometer) - from.odometer,
    components.byId[id].initialDistance,
  );
}

/**
 * Asserts that the action failed with these errors and wrote nothing.
 *
 * @param action - Runs the action.
 * @param errors - The expected errors.
 */
function expectRejected(action: () => ComponentUsageResult, errors: ComponentUsageValidationError[]): void {
  const before = useAppStore.getState();

  expect(action()).toEqual({ ok: false, errors });
  expect(useAppStore.getState()).toBe(before);
}

describe('component usage', () => {
  beforeEach(() => {
    useAppStore.setState({ ...INITIAL_APP_STATE });
  });

  describe('startComponentUse', () => {
    it('adds an open period at the reading, and writes only components', () => {
      seed(1500, [{ id: 'chain-a' }]);
      const { bicycle: bicycles } = useAppStore.getState();

      const result = useAppStore
        .getState()
        .startComponentUse(BIKE, 'chain-a', { date: ' 2026-04-12 ', odometer: 1200.5 });

      const stored = useAppStore.getState().components.byId['chain-a'];
      expect(result).toEqual({ ok: true, component: stored });
      expect(stored.usage).toEqual([
        {
          id: expect.stringMatching(UUID_PATTERN),
          bicycleId: BIKE,
          start: { date: '2026-04-12', odometer: 1200.5 },
          end: null,
          replacedPeriodId: null,
        },
      ]);
      expect(useAppStore.getState().bicycle).toBe(bicycles);
    });

    it.each([null, '', '  '])('stores an unknown start date for %j', (date) => {
      seed(0, [{ id: 'chain-a' }]);

      useAppStore.getState().startComponentUse(BIKE, 'chain-a', { date, odometer: -0 });

      const [stored] = useAppStore.getState().components.byId['chain-a'].usage;
      expect(stored.start.date).toBeNull();
      expect(Object.is(stored.start.odometer, 0)).toBe(true);
    });

    describe('errors', () => {
      it.each(['unknown', 'toString', '__proto__'])('returns only notFound for the unknown bicycle %j', (id) => {
        seed(0, [{ id: 'chain-a' }]);

        expectRejected(
          () => useAppStore.getState().startComponentUse(id, 'unknown', { date: 'x', odometer: NaN }),
          [{ field: 'bicycleId', code: 'notFound' }],
        );
      });

      it('reports only the bicycle when both ids are unknown', () => {
        seed(0, []);

        expectRejected(
          () => useAppStore.getState().startComponentUse('unknown-bike', 'unknown-part', { date: null, odometer: 0 }),
          [{ field: 'bicycleId', code: 'notFound' }],
        );
      });

      it.each(['unknown', 'toString'])('returns only notFound for the unknown component %j', (id) => {
        seed(0, []);

        expectRejected(
          () => useAppStore.getState().startComponentUse(BIKE, id, { date: 'x', odometer: NaN }),
          [{ field: 'componentId', code: 'notFound' }],
        );
      });

      it('rejects a component that the bicycle does not list', () => {
        seed(0, []);
        useAppStore.setState(({ components }) => ({
          components: {
            byId: { ...components.byId, spare: storedComponent('spare', 'chain', 'X') },
            allIds: [...components.allIds, 'spare'],
          },
        }));

        expectRejected(() => start('spare', 0), [{ field: 'componentId', code: 'notAllowed' }]);
      });

      it('rejects a component that is already in use', () => {
        seed(100, [{ id: 'chain-a', usage: [period('p-a', 0, null)] }]);

        expectRejected(() => start('chain-a', 100), [{ field: 'componentId', code: 'notAllowed' }]);
      });

      it('rejects a retired component', () => {
        seed(100, [{ id: 'chain-a', overrides: { retired: { date: '2026-04-12', bicycleId: BIKE } } }]);

        expectRejected(() => start('chain-a', 100), [{ field: 'componentId', code: 'notAllowed' }]);
      });

      it('requires naming the replaced component when the type is full', () => {
        seed(100, [{ id: 'chain-a', usage: [period('p-a', 0, null)] }, { id: 'chain-b' }]);

        expectRejected(() => start('chain-b', 100), [{ field: 'replaces', code: 'required' }]);
      });

      it.each([
        ['unknown', 'nothing'],
        ['chain-c', 'resting'],
        ['wheel-1', 'of another type'],
        ['chain-x', 'in use on another bicycle'],
      ])('rejects replacing %s (%s)', (replaces) => {
        seed(100, [
          { id: 'chain-b' },
          { id: 'chain-c' },
          { id: 'wheel-1', type: 'wheel', usage: [period('p-w', 0, null)] },
        ]);
        useAppStore.setState(({ components, bicycle: bicycles }) => ({
          bicycle: {
            ...bicycles,
            byId: { ...bicycles.byId, [OTHER_BIKE]: bicycle(OTHER_BIKE, ['chain-x'], 100) },
          },
          components: {
            byId: {
              ...components.byId,
              'chain-x': storedComponent('chain-x', 'chain', 'X', {
                usage: [period('p-x', 0, null, { bicycleId: OTHER_BIKE })],
              }),
            },
            allIds: [...components.allIds, 'chain-x'],
          },
        }));

        expectRejected(() => start('chain-b', 100, replaces), [{ field: 'replaces', code: 'notAllowed' }]);
      });

      it.each<[number, ComponentErrorCode]>([
        [NaN, 'invalidFormat'],
        [Infinity, 'invalidFormat'],
        [100.55, 'invalidFormat'],
        [-0.1, 'outOfRange'],
        [500_000.1, 'outOfRange'],
      ])('rejects the reading %s as %s', (odometer, code) => {
        seed(100, [{ id: 'chain-a' }]);

        expectRejected(() => start('chain-a', odometer), [{ field: 'odometer', code }]);
      });

      it('rejects a reading above the bicycle odometer, and accepts it at the odometer', () => {
        seed(100, [{ id: 'chain-a' }]);

        expectRejected(() => start('chain-a', 100.1), [{ field: 'odometer', code: 'outOfRange' }]);
        expect(start('chain-a', 100).ok).toBe(true);
      });

      it("rejects a reading below the component's own latest boundary on the bicycle", () => {
        seed(3000, [
          {
            id: 'chain-a',
            usage: [period('p-a', 0, 1500), period('p-other', 2000, 2500, { bicycleId: OTHER_BIKE })],
          },
        ]);

        expectRejected(() => start('chain-a', 1499), [{ field: 'odometer', code: 'outOfRange' }]);
        // The period on the other bicycle does not count.
        expect(start('chain-a', 1600).ok).toBe(true);
      });

      it('rejects a reading below the start of the replaced period', () => {
        seed(3000, [{ id: 'chain-a', usage: [period('p-a', 1500, null)] }, { id: 'chain-b' }]);

        expectRejected(() => start('chain-b', 1000, 'chain-a'), [{ field: 'odometer', code: 'outOfRange' }]);
      });

      it('rejects a start that would put two chains in use at a later reading', () => {
        seed(3000, [{ id: 'chain-a', usage: [period('p-a', 0, 1500)] }, { id: 'chain-c' }]);

        expectRejected(() => start('chain-c', 1000), [{ field: 'odometer', code: 'outOfRange' }]);
        expect(start('chain-c', 1500).ok).toBe(true);
      });

      it('rejects a date that is not a real date', () => {
        seed(100, [{ id: 'chain-a' }]);

        expectRejected(
          () => useAppStore.getState().startComponentUse(BIKE, 'chain-a', { date: '2026-02-30', odometer: 0 }),
          [{ field: 'date', code: 'invalidFormat' }],
        );
      });

      it('reports every failing field, in field order', () => {
        seed(100, [{ id: 'chain-a', usage: [period('p-a', 0, null)] }, { id: 'chain-b', usage: [period('p-b', 0, 50)] }]);

        expectRejected(
          () =>
            useAppStore
              .getState()
              .startComponentUse(BIKE, 'chain-b', { date: 'x', odometer: 200, replaces: 'unknown' }),
          [
            { field: 'replaces', code: 'notAllowed' },
            { field: 'odometer', code: 'outOfRange' },
            { field: 'date', code: 'invalidFormat' },
          ],
        );
      });

      it('returns only tooMany on usage when a new period does not fit', () => {
        const usage = Array.from({ length: COMPONENT_LIMITS.usageMaxCount }, (_, index) =>
          period(`p-${index}`, index, index + 0.5),
        );
        seed(1000, [{ id: 'chain-a', usage }]);

        expectRejected(() => start('chain-a', 600), [{ field: 'usage', code: 'tooMany' }]);
        // Reopening the last period adds none, so it still works.
        expect(start('chain-a', COMPONENT_LIMITS.usageMaxCount - 0.5).ok).toBe(true);
      });

      it('returns only tooMany on usage for a swap, leaving the replaced component in use', () => {
        const usage = Array.from({ length: COMPONENT_LIMITS.usageMaxCount }, (_, index) =>
          period(`p-${index}`, index, index + 0.5),
        );
        seed(1000, [{ id: 'chain-a', usage }, { id: 'chain-b', usage: [period('p-b', 600, null)] }]);

        expectRejected(() => start('chain-a', 700, 'chain-b'), [{ field: 'usage', code: 'tooMany' }]);
      });
    });

    describe('swaps', () => {
      it('ends the replaced period at the same reading, in one set, and records it for undo', () => {
        seed(1500, [{ id: 'chain-a', usage: [period('p-a', 0, null)] }, { id: 'chain-b' }]);
        const listener = vi.fn();
        const unsubscribe = useAppStore.subscribe(listener);

        const result = useAppStore
          .getState()
          .startComponentUse(BIKE, 'chain-b', { date: '2026-04-12', odometer: 1500, replaces: 'chain-a' });
        unsubscribe();

        expect(listener).toHaveBeenCalledOnce();
        expect(result.ok).toBe(true);
        expect(useAppStore.getState().components.byId['chain-a'].usage).toEqual([
          { ...period('p-a', 0, null), end: { date: '2026-04-12', odometer: 1500 } },
        ]);
        expect(readings('chain-b')).toEqual([[1500, null, 'p-a']]);
      });

      it('accepts a swap when the type still has room', () => {
        seed(800, [{ id: 'wheel-1', type: 'wheel', usage: [period('p-1', 0, null)] }, { id: 'wheel-2', type: 'wheel' }]);

        expect(start('wheel-2', 800, 'wheel-1').ok).toBe(true);
        expect(readings('wheel-1')).toEqual([[0, 800, null]]);
        expect(readings('wheel-2')).toEqual([[800, null, 'p-1']]);
      });

      it('leaves A with one unbroken period and B with none after A → B → A at one reading', () => {
        seed(1500, [{ id: 'chain-a', usage: [period('p-a', 0, null)] }, { id: 'chain-b' }]);

        expect(start('chain-b', 1500, 'chain-a').ok).toBe(true);
        expect(start('chain-a', 1500, 'chain-b').ok).toBe(true);

        expect(useAppStore.getState().components.byId['chain-a'].usage).toEqual([period('p-a', 0, null)]);
        expect(readings('chain-b')).toEqual([]);
      });

      it("leaves D with C's period after C → B → D at one reading", () => {
        seed(1500, [{ id: 'chain-c', usage: [period('p-c', 0, null)] }, { id: 'chain-b' }, { id: 'chain-d' }]);

        expect(start('chain-b', 1500, 'chain-c').ok).toBe(true);
        expect(start('chain-d', 1500, 'chain-b').ok).toBe(true);

        expect(readings('chain-c')).toEqual([[0, 1500, null]]);
        expect(readings('chain-b')).toEqual([]);
        expect(readings('chain-d')).toEqual([[1500, null, 'p-c']]);
      });

      it('fails for a chain swap before the latest chain swap', () => {
        seed(3100, [{ id: 'chain-a', usage: [period('p-a', 0, null)] }, { id: 'chain-b' }, { id: 'chain-c' }]);
        expect(start('chain-b', 1500, 'chain-a').ok).toBe(true);

        expectRejected(() => start('chain-c', 1000, 'chain-b'), [{ field: 'odometer', code: 'outOfRange' }]);
      });

      it('allows a late swap of one wheel after a newer swap of the other', () => {
        seed(3000, [
          { id: 'wheel-1', type: 'wheel', usage: [period('p-1', 0, null)] },
          { id: 'wheel-2', type: 'wheel', usage: [period('p-2', 0, null)] },
          { id: 'wheel-3', type: 'wheel' },
          { id: 'wheel-4', type: 'wheel' },
        ]);
        expect(start('wheel-4', 2000, 'wheel-2').ok).toBe(true);

        expect(start('wheel-3', 1000, 'wheel-1').ok).toBe(true);
        expect(readings('wheel-1')).toEqual([[0, 1000, null]]);
        expect(readings('wheel-3')).toEqual([[1000, null, 'p-1']]);
      });

      it('puts any number of front mounts in use, without a replacement', () => {
        seed(0, [
          { id: 'mount-1', type: 'frontMount', usage: [period('p-1', 0, null)] },
          { id: 'mount-2', type: 'frontMount', usage: [period('p-2', 0, null)] },
          { id: 'mount-3', type: 'frontMount' },
        ]);

        expect(start('mount-3', 0).ok).toBe(true);
      });
    });

    describe('reopening (rule 7)', () => {
      it('reopens the last period when the start is where it ended', () => {
        seed(1500, [{ id: 'chain-a', usage: [period('p-a', 0, 1500, { replacedPeriodId: 'p-old' })] }]);

        expect(start('chain-a', 1500).ok).toBe(true);

        expect(useAppStore.getState().components.byId['chain-a'].usage).toEqual([
          period('p-a', 0, null, { replacedPeriodId: 'p-old' }),
        ]);
      });

      it("keeps the reopened period's own replacedPeriodId when the dropped replaced period had another", () => {
        seed(1500, [
          { id: 'chain-a', usage: [period('p-a', 0, 1500, { replacedPeriodId: 'p-old' })] },
          { id: 'chain-b', usage: [period('p-b', 1500, null, { replacedPeriodId: 'p-a' })] },
        ]);

        expect(start('chain-a', 1500, 'chain-b').ok).toBe(true);

        expect(useAppStore.getState().components.byId['chain-a'].usage).toEqual([
          period('p-a', 0, null, { replacedPeriodId: 'p-old' }),
        ]);
        expect(readings('chain-b')).toEqual([]);
      });

      it('does not reopen a period that ended elsewhere, or on another bicycle', () => {
        seed(2000, [
          {
            id: 'chain-a',
            usage: [period('p-a', 0, 1500), period('p-other', 0, 1600, { bicycleId: OTHER_BIKE })],
          },
        ]);

        expect(start('chain-a', 1600).ok).toBe(true);
        expect(readings('chain-a')).toEqual([
          [0, 1500, null],
          [0, 1600, null],
          [1600, null, null],
        ]);
      });

      it('records the replaced period on a new period when the replaced period stays', () => {
        seed(3000, [
          { id: 'chain-a', usage: [period('p-a', 0, 1500)] },
          { id: 'chain-b', usage: [period('p-b', 1500, null, { replacedPeriodId: 'p-a' })] },
        ]);

        expect(start('chain-a', 3000, 'chain-b').ok).toBe(true);
        expect(readings('chain-a')).toEqual([
          [0, 1500, null],
          [3000, null, 'p-b'],
        ]);
      });

      it('adds a new period at the reading where its last period ended, when the replaced period stays', () => {
        // With one in use, the replaced period would start at or after 1000 and be dropped; two wheels can overlap.
        seed(3000, [
          { id: 'wheel-1', type: 'wheel', usage: [period('p-1', 0, 1000)] },
          { id: 'wheel-2', type: 'wheel', usage: [period('p-2', 500, null)] },
        ]);

        expect(start('wheel-1', 1000, 'wheel-2').ok).toBe(true);
        expect(readings('wheel-1')).toEqual([
          [0, 1000, null],
          [1000, null, 'p-2'],
        ]);
        expect(readings('wheel-2')).toEqual([[500, 1000, null]]);
      });
    });

    it('writes the usage steps of the worked example', () => {
      seed(0, [
        { id: 'chain-a' },
        { id: 'chain-b' },
        { id: 'chain-c' },
        { id: 'cassette', type: 'cassette' },
      ]);
      expect(start('chain-a', 0).ok).toBe(true);
      expect(start('cassette', 0).ok).toBe(true);

      setOdometer(1500);
      expect([distance('chain-a'), distance('chain-b'), distance('chain-c'), distance('cassette')]).toEqual([
        1500, 0, 0, 1500,
      ]);

      expect(start('chain-b', 1500, 'chain-a').ok).toBe(true);
      setOdometer(3100);
      expect([distance('chain-a'), distance('chain-b'), distance('chain-c'), distance('cassette')]).toEqual([
        1500, 1600, 0, 3100,
      ]);

      setOdometer(4500);
      expect(start('chain-a', 3100, 'chain-b').ok).toBe(true);
      expect([distance('chain-a'), distance('chain-b'), distance('chain-c'), distance('cassette')]).toEqual([
        2900, 1600, 0, 4500,
      ]);
      expect(isPersistedAppState(useAppStore.getState())).toBe(true);
    });
  });

  describe('stopComponentUse', () => {
    it('closes the open period at the reading', () => {
      seed(1500, [{ id: 'chain-a', usage: [period('p-a', 0, null)] }]);

      const result = useAppStore.getState().stopComponentUse('chain-a', { date: '2026-04-12', odometer: 1200 });

      const stored = useAppStore.getState().components.byId['chain-a'];
      expect(result).toEqual({ ok: true, component: stored });
      expect(stored.usage).toEqual([{ ...period('p-a', 0, null), end: { date: '2026-04-12', odometer: 1200 } }]);
    });

    it('drops a period of zero length', () => {
      seed(1500, [{ id: 'chain-a', usage: [period('p-old', 0, 500), period('p-a', 1500, null)] }]);

      expect(useAppStore.getState().stopComponentUse('chain-a', { date: null, odometer: 1500 }).ok).toBe(true);
      expect(readings('chain-a')).toEqual([[0, 500, null]]);
    });

    it('is undone by starting again at the same reading', () => {
      seed(1500, [{ id: 'chain-a', usage: [period('p-a', 0, null)] }]);

      useAppStore.getState().stopComponentUse('chain-a', { date: null, odometer: 1000 });
      start('chain-a', 1000);

      expect(useAppStore.getState().components.byId['chain-a'].usage).toEqual([period('p-a', 0, null)]);
    });

    it('returns only notFound for an unknown component', () => {
      seed(0, []);

      expectRejected(
        () => useAppStore.getState().stopComponentUse('__proto__', { date: 'x', odometer: NaN }),
        [{ field: 'componentId', code: 'notFound' }],
      );
    });

    it('rejects a component that is not in use', () => {
      seed(100, [{ id: 'chain-a', usage: [period('p-a', 0, 50)] }]);

      expectRejected(
        () => useAppStore.getState().stopComponentUse('chain-a', { date: null, odometer: 100 }),
        [{ field: 'componentId', code: 'notAllowed' }],
      );
    });

    it.each([
      [499.9, 'below the start'],
      [1500.1, 'above the odometer'],
    ])('rejects the reading %s (%s)', (odometer) => {
      seed(1500, [{ id: 'chain-a', usage: [period('p-a', 500, null)] }]);

      expectRejected(
        () => useAppStore.getState().stopComponentUse('chain-a', { date: null, odometer }),
        [{ field: 'odometer', code: 'outOfRange' }],
      );
    });

    it('reports a wrong number and a wrong date', () => {
      seed(1500, [{ id: 'chain-a', usage: [period('p-a', 500, null)] }]);

      expectRejected(
        () => useAppStore.getState().stopComponentUse('chain-a', { date: '2026-4-1', odometer: 600.55 }),
        [
          { field: 'odometer', code: 'invalidFormat' },
          { field: 'date', code: 'invalidFormat' },
        ],
      );
    });
  });
});
