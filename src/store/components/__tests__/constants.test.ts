import {
  ACTIVE_LIMITS,
  COMPONENT_LIMITS,
  COMPONENT_POSITIONS,
  COMPONENT_TYPES,
  DEFAULT_COMPONENT_LIMITS,
  EMPTY_COMPONENT_LIMITS,
  INITIAL_COMPONENT_COLLECTION,
} from '../constants';
import { getDefaultLimits } from '../utilities/getDefaultLimits';
import type { BicycleComponentType, ComponentPosition } from '../types';

/** Every type as a key, so a type missing here fails the typecheck. */
const ALL_TYPES: Record<BicycleComponentType, true> = {
  chain: true,
  bottomBracket: true,
  cassette: true,
  frame: true,
  fork: true,
  seatpost: true,
  saddle: true,
  pedals: true,
  wheel: true,
  handlebar: true,
  stem: true,
  barTape: true,
  tire: true,
  frontMount: true,
  brakes: true,
  shifters: true,
  derailleur: true,
};

/** Every position as a key, so a position missing here fails the typecheck. */
const ALL_POSITIONS: Record<ComponentPosition, true> = { front: true, rear: true };

describe('component constants', () => {
  it('lists every component type exactly once', () => {
    expect([...COMPONENT_TYPES].sort()).toEqual(Object.keys(ALL_TYPES).sort());
    expect(COMPONENT_TYPES).toHaveLength(17);
  });

  it('lists every position exactly once', () => {
    expect([...COMPONENT_POSITIONS].sort()).toEqual(Object.keys(ALL_POSITIONS).sort());
  });

  it('allows two in use for wheels, tires, brakes, shifters, and derailleurs, any number of front mounts, else one', () => {
    const twoInUse: BicycleComponentType[] = ['wheel', 'tire', 'brakes', 'shifters', 'derailleur'];

    for (const type of COMPONENT_TYPES) {
      const expected = type === 'frontMount' ? null : twoInUse.includes(type) ? 2 : 1;
      expect(ACTIVE_LIMITS[type]).toBe(expected);
    }
  });

  it('suggests chain limits of 0.5 % stretch, 300 km to top up, and 1500 km to clean, and none for other types', () => {
    expect(getDefaultLimits('chain')).toEqual({ distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 });

    for (const type of COMPONENT_TYPES.filter((other) => other !== 'chain')) {
      expect(getDefaultLimits(type)).toEqual(EMPTY_COMPONENT_LIMITS);
    }
  });

  it('freezes the default limits', () => {
    expect(Object.isFrozen(DEFAULT_COMPONENT_LIMITS)).toBe(true);
    expect(Object.isFrozen(DEFAULT_COMPONENT_LIMITS.chain)).toBe(true);
    expect(Object.isFrozen(EMPTY_COMPONENT_LIMITS)).toBe(true);
  });

  it('allows a history distance of 1 000 000 km', () => {
    expect(COMPONENT_LIMITS.distanceMax).toBe(1_000_000);
  });

  it('freezes the initial collection', () => {
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION)).toBe(true);
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION.byId)).toBe(true);
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION.allIds)).toBe(true);
  });
});
