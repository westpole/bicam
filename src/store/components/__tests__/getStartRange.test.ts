import type { Bicycle, BicycleCollection } from '../../bicycle/types';
import { storedComponent } from '../__mocks__/storedComponent';
import type { BicycleComponent, ComponentCollection, ComponentUsagePeriod } from '../types';
import { getStartRange } from '../utilities/getStartRange';

const BIKE = 'bike-1';

/**
 * Builds a collection with one bicycle that lists the given components.
 *
 * @param odometer - Its odometer in kilometres.
 * @param components - The ids it lists.
 * @returns The bicycle collection.
 */
function bicycles(odometer: number, components: string[]): BicycleCollection {
  const bicycle: Bicycle = {
    id: BIKE,
    name: 'Grizl',
    company: 'Canyon',
    model: 'Grizl',
    purchased: null,
    size: null,
    frameGeometry: null,
    components,
    odometer,
    odometerDate: null,
  };

  return { byId: { [BIKE]: bicycle }, allIds: [BIKE] };
}

/**
 * Builds a usage period on {@link BIKE} with no dates.
 *
 * @param start - The start reading.
 * @param end - The end reading, or `null` while in use.
 * @returns The period.
 */
function period(start: number, end: number | null): ComponentUsagePeriod {
  return {
    id: `period-${start}`,
    bicycleId: BIKE,
    start: { date: null, odometer: start },
    end: end === null ? null : { date: null, odometer: end },
    replacedPeriodId: null,
  };
}

/**
 * Builds a collection from components in order.
 *
 * @param components - The components.
 * @returns The collection.
 */
function collection(...components: BicycleComponent[]): ComponentCollection {
  return {
    byId: Object.fromEntries(components.map((component) => [component.id, component])),
    allIds: components.map(({ id }) => id),
  };
}

describe('getStartRange', () => {
  it('runs from 0 to the odometer when nothing of the type was used on the bicycle', () => {
    const chains = ['a', 'b', 'c'].map((id) => storedComponent(id, 'chain', 'X12'));

    expect(getStartRange(bicycles(1500, ['a', 'b', 'c']), collection(...chains), BIKE, 'b', null)).toEqual({
      min: 0,
      max: 1500,
    });
  });

  it('starts at the replaced period, for a late swap of the worked example', () => {
    // Swap A → B at 1500, odometer 4500: B → A may go back to 1500, where B started.
    const a = storedComponent('a', 'chain', 'X12', { usage: [period(0, 1500)] });
    const b = storedComponent('b', 'chain', 'X12', { usage: [period(1500, null)] });

    expect(getStartRange(bicycles(4500, ['a', 'b']), collection(a, b), BIKE, 'a', 'b')).toEqual({
      min: 1500,
      max: 4500,
    });
  });

  it("starts at the component's own latest boundary", () => {
    const a = storedComponent('a', 'chain', 'X12', { usage: [period(0, 2000)] });
    const b = storedComponent('b', 'chain', 'X12', { usage: [period(500, null)] });

    // B started at 500, but A ran until 2000.
    expect(getStartRange(bicycles(3000, ['a', 'b']), collection(a, b), BIKE, 'a', 'b')).toEqual({
      min: 2000,
      max: 3000,
    });
  });

  it('starts after the last period of the type when one in use at a time must not overlap', () => {
    const a = storedComponent('a', 'chain', 'X12', { usage: [period(1000, 2000)] });
    const c = storedComponent('c', 'chain', 'X12');

    expect(getStartRange(bicycles(3000, ['a', 'c']), collection(a, c), BIKE, 'c', null)).toEqual({
      min: 2000,
      max: 3000,
    });
  });

  it('allows an earlier start when the type has room for two', () => {
    const front = storedComponent('front', 'tire', 'GP5000', { usage: [period(1000, null)] });
    const rear = storedComponent('rear', 'tire', 'GP5000');

    expect(getStartRange(bicycles(3000, ['front', 'rear']), collection(front, rear), BIKE, 'rear', null)).toEqual({
      min: 0,
      max: 3000,
    });
  });

  it('still finds the range when the type is full and no replacement is named', () => {
    const a = storedComponent('a', 'chain', 'X12', { usage: [period(0, 1500)] });
    const b = storedComponent('b', 'chain', 'X12', { usage: [period(1500, null)] });

    // The store also reports `replaces: required`; only the reading's own bounds count here.
    expect(getStartRange(bicycles(4500, ['a', 'b']), collection(a, b), BIKE, 'a', null)).toEqual({
      min: 1500,
      max: 4500,
    });
  });

  it('is null for unknown ids', () => {
    const a = storedComponent('a', 'chain', 'X12');

    expect(getStartRange(bicycles(0, ['a']), collection(a), 'bike-unknown', 'a', null)).toBeNull();
    expect(getStartRange(bicycles(0, ['a']), collection(a), BIKE, 'unknown', null)).toBeNull();
  });
});
