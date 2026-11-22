import type { BicycleCollection } from './types';

/**
 * Empty bicycle collection used as the initial `bicycle` slice. Frozen (with its `byId` and `allIds`) because it is
 * shared by every reset; actions must replace it, never mutate it.
 */
export const INITIAL_BICYCLE_COLLECTION: Readonly<BicycleCollection> = { byId: {}, allIds: [] };
Object.freeze(INITIAL_BICYCLE_COLLECTION.byId);
Object.freeze(INITIAL_BICYCLE_COLLECTION.allIds);
Object.freeze(INITIAL_BICYCLE_COLLECTION);
