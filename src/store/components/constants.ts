import type {
  BicycleComponentType,
  ComponentCollection,
  ComponentField,
  ComponentLimits,
  ComponentLimitsByType,
  ComponentPosition,
  Lubricant,
  Subcomponent,
} from './types';

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
  labelMaxLength: 20,
  initialDistanceMax: 500_000,
  /** Largest `limits.distance`, `limits.lubrication`, and `limits.cleaning`, in kilometres. */
  limitDistanceMax: 500_000,
  historyMaxCount: 500,
  distanceMax: 1_000_000,
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
  'fork',
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

/** Every limit, in field order. */
export const COMPONENT_LIMIT_KEYS: readonly (keyof ComponentLimits)[] = [
  'distance',
  'stretch',
  'lubrication',
  'cleaning',
];

/** Limits that only the types in `CHAIN_CARE_TYPES` can have. */
export const CHAIN_LIMIT_KEYS: readonly (keyof ComponentLimits)[] = ['stretch', 'lubrication', 'cleaning'];

/** The fields that component validation reports, in the order it reports them. */
export const COMPONENT_FIELD_ORDER: readonly ComponentField[] = [
  'type',
  'model',
  'label',
  'initialDistance',
  'limits.distance',
  'limits.stretch',
  'limits.lubrication',
  'limits.cleaning',
];

/** Every lubricant. Lists each {@link Lubricant} exactly once. */
export const LUBRICANTS: readonly Lubricant[] = ['oil', 'wax'];

/**
 * How many components of each type can be in use on one bicycle at a time; `null` means no limit. Two wheels or tires
 * are not told apart by position. Documented in `docs/store/components.md` §2.3.
 */
export const ACTIVE_LIMITS: Readonly<Record<BicycleComponentType, number | null>> = {
  chain: 1,
  bottomBracket: 1,
  cassette: 1,
  frame: 1,
  fork: 1,
  seatpost: 1,
  saddle: 1,
  pedals: 1,
  wheel: 2,
  handlebar: 1,
  stem: 1,
  barTape: 1,
  tire: 2,
  frontMount: null,
  brakes: 2,
  shifters: 2,
  derailleur: 2,
};

/** Limits of a type without suggested values: none at all. */
export const EMPTY_COMPONENT_LIMITS: Readonly<ComponentLimits> = Object.freeze({
  distance: null,
  stretch: null,
  lubrication: null,
  cleaning: null,
});

/**
 * Suggested limits per type, used for new components and after a type change. Types that are not listed start with
 * {@link EMPTY_COMPONENT_LIMITS}. A chain is replaced at 0.5 % stretch (11–13-speed; 0.75 % suits 5–10-speed), topped
 * up every 300 km, and cleaned and relubricated every 1500 km. Documented in `docs/store/components.md` §2.3.
 */
export const DEFAULT_COMPONENT_LIMITS: Readonly<ComponentLimitsByType> = Object.freeze({
  chain: Object.freeze({ distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 }),
});
