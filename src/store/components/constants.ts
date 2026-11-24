import type { BicycleComponentType, ComponentCollection, ComponentPosition, Subcomponent } from './types';

/**
 * Empty component collection used as the initial `components` slice. Frozen (with its `byId` and `allIds`) because it
 * is shared by every reset; actions must replace it, never mutate it.
 */
export const INITIAL_COMPONENT_COLLECTION: Readonly<ComponentCollection> = { byId: {}, allIds: [] };
Object.freeze(INITIAL_COMPONENT_COLLECTION.byId);
Object.freeze(INITIAL_COMPONENT_COLLECTION.allIds);
Object.freeze(INITIAL_COMPONENT_COLLECTION);

/**
 * Component field limits. Lengths are counted in UTF-16 code units after trimming; distances are in kilometres and
 * stretch is in percent. Documented in `docs/store/components.md` §2.
 */
export const COMPONENT_LIMITS = {
  modelMaxLength: 60,
  historyMaxCount: 500,
  distanceMax: 500_000,
  distanceMaxDecimals: 1,
  stretchMax: 5,
  stretchMaxDecimals: 2,
} as const;

/** Every component type. Lists each {@link BicycleComponentType} exactly once. */
export const COMPONENT_TYPES: readonly BicycleComponentType[] = [
  'chain',
  'bottomBracket',
  'cassette',
  'frame',
  'seatpost',
  'saddle',
  'pedals',
  'wheel',
  'handlebar',
  'stem',
  'barTape',
  'tire',
  'frontMount',
  'brakes',
  'shifters',
  'derailleur',
];

/** Every position. Lists each {@link ComponentPosition} exactly once. */
export const COMPONENT_POSITIONS: readonly ComponentPosition[] = ['front', 'rear'];

/** Types whose history entries can have a `position`. Documented in `docs/store/components.md` §3. */
export const POSITION_TYPES: readonly BicycleComponentType[] = ['brakes', 'shifters', 'derailleur'];

/**
 * Types whose history entries can have `lubricated` and `stretch`. Documented in `docs/store/components.md` §3.
 */
export const CHAIN_CARE_TYPES: readonly BicycleComponentType[] = ['chain'];

/**
 * Subcomponents per type. History entries of a type that is not listed cannot have a `subcomponent`. Documented in
 * `docs/store/components.md` §3.
 */
export const SUBCOMPONENTS: Readonly<Partial<Record<BicycleComponentType, readonly Subcomponent[]>>> = {
  wheel: ['hub', 'spokes', 'rim', 'valve'],
  brakes: ['lever', 'hose', 'caliper', 'rotor', 'brakePads', 'brakeFluid'],
  shifters: ['shifter', 'hose', 'cable', 'derailleur'],
};
