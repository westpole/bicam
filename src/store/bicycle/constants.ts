import type { BicycleCollection } from './types';

/**
 * Empty bicycle collection used as the initial `bicycle` slice. Frozen (with its `byId` and `allIds`) because it is
 * shared by every reset; actions must replace it, never mutate it.
 */
export const INITIAL_BICYCLE_COLLECTION: Readonly<BicycleCollection> = { byId: {}, allIds: [] };
Object.freeze(INITIAL_BICYCLE_COLLECTION.byId);
Object.freeze(INITIAL_BICYCLE_COLLECTION.allIds);
Object.freeze(INITIAL_BICYCLE_COLLECTION);

/** Bicycle field limits, counted in UTF-16 code units after trimming. Documented in `docs/store/bicycle.md` §2. */
export const BICYCLE_LIMITS = {
  idMaxLength: 40,
  companyMaxLength: 60,
  modelMaxLength: 60,
  sizeMaxLength: 10,
  frameGeometryMaxLength: 500,
  componentIdMaxLength: 64,
  componentsMaxCount: 100,
} as const;

/** Matches any control character (C0, DEL, C1). Not allowed in single-line text. */
export const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;

/** Matches any control character except line breaks. Not allowed in multi-line text (`frameGeometry`). */
export const MULTILINE_FORBIDDEN_PATTERN = /(?![\r\n])\p{Cc}/u;

/** A valid frame size: letters, digits, space, `.`, `/`, `-` (e.g. `ML`, `M/L`, `51`, `56.5`). */
export const SIZE_PATTERN = /^[A-Za-z0-9 ./-]+$/;

/** Shape of an ISO calendar date, capturing year, month, and day. Calendar validity is checked separately. */
export const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
