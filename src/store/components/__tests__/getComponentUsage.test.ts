import type { Bicycle } from '../../bicycle/types';
import { INITIAL_APP_STATE } from '../../constants';
import { useAppStore } from '../../useAppStore';
import { storedComponent } from '../__mocks__/storedComponent';
import type {
  BicycleComponent,
  BicycleComponentType,
  ComponentHistoryEntry,
  ComponentHistoryInput,
  ComponentUsagePeriod,
} from '../types';
import { getComponentUsage } from '../utilities/getComponentUsage';

const BIKE = 'bike-1';
const OTHER_BIKE = 'bike-2';
const REMOVED_BIKE = 'bike-removed';

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
 * Builds a usage period with no dates.
 *
 * @param bicycleId - The bicycle it names.
 * @param start - The start reading.
 * @param end - The end reading, or `null` while in use.
 * @returns The period.
 */
function period(bicycleId: string, start: number, end: number | null): ComponentUsagePeriod {
  return {
    id: `period-${bicycleId}-${start}`,
    bicycleId,
    start: { date: null, odometer: start },
    end: end === null ? null : { date: null, odometer: end },
    replacedPeriodId: null,
  };
}

/**
 * Builds a whole-component history entry with no care values.
 *
 * @param id - The entry id.
 * @param overrides - Fields to replace.
 * @returns The entry.
 */
function entry(id: string, overrides: Partial<ComponentHistoryEntry> = {}): ComponentHistoryEntry {
  return {
    id,
    date: '2026-05-01',
    installed: '2026-05-01',
    distance: null,
    position: null,
    subcomponent: null,
    lubricated: null,
    stretch: null,
    lubricant: null,
    cleaned: null,
    ...overrides,
  };
}

/**
 * Builds a component and derives its usage against `BIKE` at `odometer` and `OTHER_BIKE` at 5000.
 *
 * @param overrides - Component fields to replace.
 * @param odometer - `BIKE`'s odometer.
 * @param type - The component type; `chain` by default.
 * @returns The derived usage.
 */
function usageOf(overrides: Partial<BicycleComponent>, odometer = 1000, type: BicycleComponentType = 'chain') {
  return getComponentUsage(storedComponent('part', type, 'Model', overrides), {
    [BIKE]: bicycle(BIKE, ['part'], odometer),
    [OTHER_BIKE]: bicycle(OTHER_BIKE, [], 5000),
  });
}

describe('getComponentUsage', () => {
  describe('worked example through the store', () => {
    /**
     * Derives a stored component's usage from the current store state.
     *
     * @param id - The component.
     * @returns The derived usage.
     */
    function usage(id: string) {
      const { components, bicycle: bicycles } = useAppStore.getState();

      return getComponentUsage(components.byId[id], bicycles.byId);
    }

    /**
     * Sets `BIKE`'s odometer, failing the test when it is rejected.
     *
     * @param odometer - The new total.
     */
    function setOdometer(odometer: number): void {
      expect(useAppStore.getState().setBicycleOdometer(BIKE, { odometer, date: null }).ok).toBe(true);
    }

    /**
     * Starts a component on `BIKE`, failing the test when it is rejected.
     *
     * @param id - The component.
     * @param odometer - The reading.
     * @param replaces - The replaced component.
     */
    function start(id: string, odometer: number, replaces: string): void {
      expect(useAppStore.getState().startComponentUse(BIKE, id, { date: null, odometer, replaces }).ok).toBe(true);
    }

    /**
     * Adds a history entry to chain A, failing the test when it is rejected.
     *
     * @param input - The entry.
     */
    function logCare(input: ComponentHistoryInput): void {
      expect(useAppStore.getState().addComponentHistoryEntry('chain-a', input).ok).toBe(true);
    }

    beforeEach(() => {
      const ids = ['chain-a', 'chain-b', 'chain-c', 'cassette'];
      const open = [period(BIKE, 0, null)];

      useAppStore.setState({
        ...INITIAL_APP_STATE,
        bicycle: { byId: { [BIKE]: bicycle(BIKE, ids, 0) }, allIds: [BIKE] },
        components: {
          byId: {
            'chain-a': storedComponent('chain-a', 'chain', 'CN-M8100', {
              usage: open,
            }),
            'chain-b': storedComponent('chain-b', 'chain', 'CN-M8100'),
            'chain-c': storedComponent('chain-c', 'chain', 'CN-M8100'),
            cassette: storedComponent('cassette', 'cassette', 'CS-M8100', {
              usage: open,
            }),
          },
          allIds: ids,
        },
      });
    });

    it('matches the first three steps of the usage table', () => {
      const distances = () => ['chain-a', 'chain-b', 'chain-c', 'cassette'].map((id) => usage(id).distance);

      setOdometer(1500);
      expect(distances()).toEqual([1500, 0, 0, 1500]);

      start('chain-b', 1500, 'chain-a');
      setOdometer(3100);
      expect(distances()).toEqual([1500, 1600, 0, 3100]);

      setOdometer(4500);
      start('chain-a', 3100, 'chain-b');
      expect(distances()).toEqual([2900, 1600, 0, 4500]);

      expect(usage('chain-a')).toMatchObject({
        distanceSinceInstalled: 1400,
        isInUse: true,
      });
      expect(usage('cassette')).toMatchObject({
        distanceSinceInstalled: 4500,
        isInUse: true,
      });
      expect(usage('chain-b')).toMatchObject({
        distanceSinceInstalled: null,
        isInUse: false,
      });
      expect(usage('chain-c')).toMatchObject({
        distance: 0,
        distanceSinceInstalled: null,
        isInUse: false,
      });
    });

    it('matches the care table', () => {
      const care = () => {
        const { distanceSinceLubrication, distanceSinceCleaning } = usage('chain-a');

        return [distanceSinceLubrication, distanceSinceCleaning];
      };
      const clean = {
        lubricated: '',
        lubricant: 'wax',
        cleaned: '',
        installed: '2026-05-01',
      };

      logCare({
        ...clean,
        date: '2026-05-01',
        lubricated: '2026-05-01',
        cleaned: '2026-05-01',
        distance: 0,
      });
      setOdometer(300);
      expect(care()).toEqual([300, 300]);
      expect(usage('chain-a').lubricant).toBe('wax');

      logCare({
        date: '2026-05-10',
        installed: '2026-05-01',
        lubricated: '2026-05-10',
        lubricant: 'wax',
        distance: 300,
      });
      setOdometer(550);
      expect(care()).toEqual([250, 550]);

      setOdometer(1500);
      logCare({
        ...clean,
        date: '2026-06-01',
        lubricated: '2026-06-01',
        cleaned: '2026-06-01',
        distance: 1500,
      });
      expect(care()).toEqual([0, 0]);
    });
  });

  describe('distance', () => {
    it('is the initial distance for a component that was never used', () => {
      expect(usageOf({ initialDistance: 250 })).toMatchObject({
        distance: 250,
        distanceSinceInstalled: null,
        isInUse: false,
      });
    });

    it('adds the initial distance, a move between bicycles, and closed periods on a removed bicycle', () => {
      const usage = usageOf({
        initialDistance: 100,
        usage: [period(REMOVED_BIKE, 0, 700), period(OTHER_BIKE, 1000, 1200), period(BIKE, 400, null)],
      });

      expect(usage).toEqual(
        expect.objectContaining({
          distance: 100 + 700 + 200 + 600,
          distanceSinceInstalled: 600,
          isInUse: true,
        }),
      );
    });

    it('rounds to 1 decimal', () => {
      expect(usageOf({ initialDistance: 0.1, usage: [period(BIKE, 0, 0.2)] }).distance).toBe(0.3);
      expect(usageOf({ usage: [period(BIKE, 0.1, null)] }, 0.4).distanceSinceInstalled).toBe(0.3);
    });

    it('counts an open period whose bicycle is not given as zero length', () => {
      expect(
        usageOf({
          initialDistance: 50,
          usage: [period(REMOVED_BIKE, 300, null)],
        }),
      ).toMatchObject({
        distance: 50,
        distanceSinceInstalled: 0,
        isInUse: true,
      });
    });

    it('does not read inherited keys as bicycles', () => {
      expect(usageOf({ usage: [period('toString', 300, null)] }).distance).toBe(0);
    });
  });

  describe('chain care', () => {
    it('gives null for every care value without entries', () => {
      expect(usageOf({})).toMatchObject({
        stretch: null,
        lubricant: null,
        distanceSinceLubrication: null,
        distanceSinceCleaning: null,
      });
    });

    it('takes the newest entry by date, also when added out of order', () => {
      const usage = usageOf({
        initialDistance: 1000,
        history: [
          entry('new', {
            date: '2026-06-01',
            stretch: 0.5,
            lubricated: '2026-06-01',
            lubricant: 'oil',
            distance: 900,
          }),
          entry('old', {
            date: '2026-05-01',
            stretch: 0.25,
            lubricated: '2026-05-01',
            lubricant: 'wax',
            distance: 400,
          }),
        ],
      });

      expect(usage).toMatchObject({
        stretch: 0.5,
        lubricant: 'oil',
        distanceSinceLubrication: 100,
      });
    });

    it('takes the last one added on equal dates', () => {
      const usage = usageOf({
        initialDistance: 1000,
        history: [
          entry('first', {
            stretch: 0.25,
            lubricated: '2026-05-01',
            lubricant: 'wax',
            distance: 400,
          }),
          entry('second', {
            stretch: 0.5,
            lubricated: '2026-05-01',
            lubricant: null,
            distance: 700,
          }),
        ],
      });

      expect(usage).toMatchObject({
        stretch: 0.5,
        lubricant: null,
        distanceSinceLubrication: 300,
      });
    });

    it('takes stretch from the newest entry that has one', () => {
      const history = [entry('measured', { date: '2026-05-01', stretch: 0.3 }), entry('later', { date: '2026-06-01' })];

      expect(usageOf({ history }).stretch).toBe(0.3);
    });

    it('keeps the distance since cleaning after a top-up, and restarts both after a clean', () => {
      const clean = (id: string, date: string, distance: number) =>
        entry(id, {
          date,
          lubricated: date,
          cleaned: date,
          lubricant: 'wax',
          distance,
        });
      const topUp = entry('top-up', {
        date: '2026-05-10',
        lubricated: '2026-05-10',
        lubricant: 'wax',
        distance: 300,
      });

      expect(
        usageOf({
          initialDistance: 550,
          history: [clean('clean', '2026-05-01', 0), topUp],
        }),
      ).toMatchObject({
        distanceSinceLubrication: 250,
        distanceSinceCleaning: 550,
      });
      expect(
        usageOf({
          initialDistance: 550,
          history: [topUp, clean('clean', '2026-06-01', 500)],
        }),
      ).toMatchObject({
        distanceSinceLubrication: 50,
        distanceSinceCleaning: 50,
      });
    });

    it('takes the last clean added on equal dates', () => {
      const clean = (id: string, distance: number) =>
        entry(id, { lubricated: '2026-05-01', cleaned: '2026-05-01', distance });

      expect(usageOf({ initialDistance: 1000, history: [clean('first', 200), clean('second', 600)] })).toMatchObject({
        distanceSinceCleaning: 400,
      });
      expect(usageOf({ initialDistance: 1000, history: [clean('second', 600), clean('first', 200)] })).toMatchObject({
        distanceSinceCleaning: 800,
      });
    });

    it('picks the newest lubrication and the newest clean independently', () => {
      const history = [
        entry('cleaned', { date: '2026-06-01', lubricated: null, cleaned: '2026-06-01', distance: 800 }),
        entry('lubricated', { date: '2026-05-01', lubricated: '2026-05-01', lubricant: 'oil', distance: 300 }),
      ];

      expect(usageOf({ initialDistance: 1000, history })).toMatchObject({
        lubricant: 'oil',
        distanceSinceLubrication: 700,
        distanceSinceCleaning: 200,
      });
    });

    it('gives null when the newest entry has no distance', () => {
      const history = [
        entry('old', {
          date: '2026-05-01',
          lubricated: '2026-05-01',
          cleaned: '2026-05-01',
          distance: 0,
        }),
        entry('new', {
          date: '2026-06-01',
          lubricated: '2026-06-01',
          cleaned: '2026-06-01',
          distance: null,
        }),
      ];

      expect(usageOf({ history })).toMatchObject({
        distanceSinceLubrication: null,
        distanceSinceCleaning: null,
      });
    });

    it('gives 0 when the entry has a distance above the current one', () => {
      const history = [
        entry('high', {
          lubricated: '2026-05-01',
          cleaned: '2026-05-01',
          distance: 5000,
        }),
      ];

      expect(usageOf({ history })).toMatchObject({
        distanceSinceLubrication: 0,
        distanceSinceCleaning: 0,
      });
    });

    it('rounds the distance since care to 1 decimal', () => {
      const history = [entry('care', { lubricated: '2026-05-01', distance: 0.1 })];

      expect(usageOf({ initialDistance: 0.4 }).distance).toBe(0.4);
      expect(usageOf({ initialDistance: 0.4, history }).distanceSinceLubrication).toBe(0.3);
    });

    it('ignores entries about a subcomponent', () => {
      const history = [
        entry('part', {
          subcomponent: 'hub',
          stretch: 0.5,
          lubricated: '2026-05-01',
          distance: 0,
        }),
      ];

      expect(usageOf({ history })).toMatchObject({
        stretch: null,
        distanceSinceLubrication: null,
      });
    });

    it('gives null for every care value on other types', () => {
      const history = [
        entry('care', {
          stretch: 0.5,
          lubricated: '2026-05-01',
          lubricant: 'oil',
          distance: 0,
        }),
      ];

      expect(usageOf({ history }, 1000, 'cassette')).toEqual({
        distance: 0,
        distanceSinceInstalled: null,
        isInUse: false,
        stretch: null,
        lubricant: null,
        distanceSinceLubrication: null,
        distanceSinceCleaning: null,
      });
    });
  });
});
