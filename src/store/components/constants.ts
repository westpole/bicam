import type { BicycleComponentType, ComponentCollection } from './types';

/**
 * Empty component collection used as the initial `components` slice. Frozen (with its `byId` and `allIds`) because it
 * is shared by every reset; actions must replace it, never mutate it.
 */
export const INITIAL_COMPONENT_COLLECTION: Readonly<ComponentCollection> = { byId: {}, allIds: [] };
Object.freeze(INITIAL_COMPONENT_COLLECTION.byId);
Object.freeze(INITIAL_COMPONENT_COLLECTION.allIds);
Object.freeze(INITIAL_COMPONENT_COLLECTION);

/**
 * Component field limits. Lengths are counted in UTF-16 code units after trimming; distances are in kilometres.
 * Documented in `docs/store/components.md` §2.
 */
export const COMPONENT_LIMITS = {
  modelMaxLength: 60,
  historyMaxCount: 500,
  distanceMax: 500_000,
  distanceMaxDecimals: 1,
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
