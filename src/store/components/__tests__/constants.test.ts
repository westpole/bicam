import { COMPONENT_TYPES, INITIAL_COMPONENT_COLLECTION } from '../constants';
import type { BicycleComponentType } from '../types';

/** Every type as a key, so a type missing here fails the typecheck. */
const ALL_TYPES: Record<BicycleComponentType, true> = {
  chain: true,
  bottomBracket: true,
  cassette: true,
  frame: true,
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

describe('component constants', () => {
  it('lists every component type exactly once', () => {
    expect([...COMPONENT_TYPES].sort()).toEqual(Object.keys(ALL_TYPES).sort());
    expect(COMPONENT_TYPES).toHaveLength(16);
  });

  it('freezes the initial collection', () => {
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION)).toBe(true);
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION.byId)).toBe(true);
    expect(Object.isFrozen(INITIAL_COMPONENT_COLLECTION.allIds)).toBe(true);
  });
});
