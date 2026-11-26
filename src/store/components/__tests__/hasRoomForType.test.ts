import { storedComponent } from '../__mocks__/storedComponent';
import type { BicycleComponentType, ComponentUsagePeriod } from '../types';
import { getComponentsInUse } from '../utilities/getComponentsInUse';
import { hasRoomForType } from '../utilities/hasRoomForType';

/**
 * Builds a component of a type, in use or resting.
 *
 * @param id - The component id.
 * @param type - The type.
 * @param inUse - Whether it has an open period.
 * @returns The component.
 */
function part(id: string, type: BicycleComponentType, inUse: boolean) {
  const period: ComponentUsagePeriod = {
    id: `period-${id}`,
    bicycleId: 'bike-1',
    start: { date: null, odometer: 0 },
    end: inUse ? null : { date: null, odometer: 100 },
    replacedPeriodId: null,
  };

  return storedComponent(id, type, 'Model', { usage: [period] });
}

describe('getComponentsInUse', () => {
  it('lists the components of the type with an open period, in order', () => {
    const chainA = part('a', 'chain', true);
    const chainB = part('b', 'chain', false);
    const tire = part('t', 'tire', true);

    expect(getComponentsInUse([chainB, tire, chainA], 'chain')).toEqual([chainA]);
    expect(getComponentsInUse([], 'chain')).toEqual([]);
  });
});

describe('hasRoomForType', () => {
  it('has room below the limit and none at it', () => {
    expect(hasRoomForType([], 'chain')).toBe(true);
    expect(hasRoomForType([part('b', 'chain', false)], 'chain')).toBe(true);
    expect(hasRoomForType([part('a', 'chain', true)], 'chain')).toBe(false);
    expect(hasRoomForType([part('a', 'chain', true)], 'cassette')).toBe(true);
  });

  it('allows two of a type with two in use', () => {
    expect(hasRoomForType([part('front', 'wheel', true)], 'wheel')).toBe(true);
    expect(hasRoomForType([part('front', 'wheel', true), part('rear', 'wheel', true)], 'wheel')).toBe(false);
  });

  it('always has room for a type without a limit', () => {
    const mounts = Array.from({ length: 5 }, (_, index) => part(`m${index}`, 'frontMount', true));

    expect(hasRoomForType(mounts, 'frontMount')).toBe(true);
  });
});
