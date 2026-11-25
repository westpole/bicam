import { COMPONENT_POSITIONS, COMPONENT_TYPES, INITIAL_COMPONENT_COLLECTION } from '../constants';
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

  it('freezes the initial collection', () => {
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION)).toBe(true);
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION.byId)).toBe(true);
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION.allIds)).toBe(true);
  });
});
