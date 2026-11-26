import type { IsoDate } from '../common/types';
import type { ComponentId } from '../components/types';

/** Generated bicycle identifier (UUID v4). Assigned by `addBicycle` and never changed. */
export type BicycleId = string;

/**
 * A stored bicycle. Plain JSON: unknown optional values are `null`. Field limits are documented in
 * `docs/store/bicycle.md`.
 */
export interface Bicycle {
  /** Generated UUID; the key other slices use to reference this bicycle. Never changes. */
  id: BicycleId;
  /** User-typed name shown as the bicycle's title. Unique (case-insensitive), 1–40 chars, can be renamed. */
  name: string;
  /** Manufacturer or brand. 1–60 chars. */
  company: string;
  /** Model name. 1–60 chars. */
  model: string;
  /** Purchase date, or `null` when unknown. */
  purchased: IsoDate | null;
  /** Letter or numeric frame size as typed (`'ML'`, `'51'`), or `null` when unknown. 1–10 chars. */
  size: string | null;
  /** Free-text frame geometry notes, or `null` when unknown. 1–500 chars. */
  frameGeometry: string | null;
  /** Ids of the components currently installed. Stored components only, on no other bicycle, unique, up to 100. */
  components: ComponentId[];
  /** Total distance in kilometres, as the rider entered it. Starts at 0. */
  odometer: number;
  /** Date of the `odometer` reading, or `null` when unknown. */
  odometerDate: IsoDate | null;
}

/**
 * Every bicycle field the bicycle form edits: a {@link Bicycle} without its generated `id` and its odometer, which has
 * its own action.
 */
export type BicycleDetails = Omit<Bicycle, 'id' | 'odometer' | 'odometerDate'>;

/**
 * Raw bicycle data as a form provides it. Normalized by `normalizeBicycleInput` before validation: strings are
 * trimmed, empty optional text becomes `null`, and a missing `components` list becomes `[]`.
 */
export interface BicycleInput {
  /** See {@link Bicycle.name}. */
  name: string;
  /** See {@link Bicycle.company}. */
  company: string;
  /** See {@link Bicycle.model}. */
  model: string;
  /** `YYYY-MM-DD`; missing, `null`, or blank means unknown. */
  purchased?: string | null;
  /** Missing, `null`, or blank means unknown. */
  size?: string | null;
  /** Missing, `null`, or blank means unknown. */
  frameGeometry?: string | null;
  /** Installed component ids; missing means none. */
  components?: string[];
}

/** Changes for `updateBicycle`: any input field. Omitted keys stay unchanged; `null` clears an optional field. */
export type BicycleUpdate = Partial<BicycleInput>;

/** A new odometer reading for `setBicycleOdometer`. */
export interface BicycleOdometerInput {
  /** The bicycle's total in kilometres (not a ride: the UI adds a ride to the current total). */
  odometer: number;
  /** `YYYY-MM-DD` of the reading; `null` or blank means unknown. The store has no clock, so the UI supplies today. */
  date: string | null;
}

/** A field of {@link Bicycle} that a validation error can point at. */
export type BicycleField = keyof Bicycle;

/** Why a field failed validation. Codes, not text: the UI translates them. See `docs/store/bicycle.md` §5. */
export type BicycleErrorCode =
  | 'required'
  | 'tooLong'
  | 'invalidFormat'
  | 'tooMany'
  | 'duplicate'
  | 'notFound'
  | 'alreadyInstalled'
  | 'outOfRange';

/** One failing field. Validation reports at most one error per field. */
export interface BicycleValidationError {
  /** The failing field. */
  field: BicycleField;
  /** Why it failed. */
  code: BicycleErrorCode;
}

/**
 * Result of a bicycle write: the stored bicycle on success, every failing field otherwise. On success `bicycle` is
 * the object held in the store; treat it as read-only.
 */
export type BicycleResult = { ok: true; bicycle: Bicycle } | { ok: false; errors: BicycleValidationError[] };

/**
 * A validated `updateBicycle` that is not written yet: the updated bicycle and the collection that holds it. Writing
 * `collection` applies it, so the store can write other keys in the same `set`.
 */
export type BicycleUpdatePlan =
  | { ok: true; bicycle: Bicycle; collection: BicycleCollection }
  | { ok: false; errors: BicycleValidationError[] };

/** Bicycle actions on `useAppStore`. A failed action never changes state. See `docs/store/bicycle.md` §4. */
export interface BicycleActions {
  /**
   * Normalizes and validates `input`, generates a new id, stores the bicycle with an odometer of 0 and no odometer
   * date, and appends the id to `allIds`. Fails with `duplicate` on `name` when another bicycle has the same name,
   * ignoring case, and on `components` with `notFound` when a listed component is not stored or `alreadyInstalled`
   * when it is on another bicycle.
   */
  addBicycle: (input: BicycleInput) => BicycleResult;
  /**
   * Merges `changes` into the bicycle stored under `id`, then normalizes and validates it. Renaming is allowed; the
   * new name must not clash with another bicycle's name. `null` clears an optional field; omitted or `undefined`
   * keys are unchanged. The odometer fields are always kept, and such keys in `changes` are ignored. Fails with
   * `notFound` on `id` for an unknown id, and on `components` with `notFound` when a listed component is not stored
   * or `alreadyInstalled` when it is on another bicycle. New ids get no period. The `useAppStore` wrapper also closes
   * the open period of each component that is no longer listed at the bicycle's odometer and odometer date, in the
   * same `set` (rule 8); the slice action alone writes only `bicycle` and must not be called outside that wrapper.
   */
  updateBicycle: (id: BicycleId, changes: BicycleUpdate) => BicycleResult;
  /**
   * Removes the bicycle stored under `id`. Returns `false`, changing nothing, for an unknown id. The `useAppStore`
   * wrapper also closes the open period of every component on it at its odometer and odometer date, in the same `set`
   * (rule 8); the slice action alone writes only `bicycle` and must not be called outside that wrapper.
   */
  removeBicycle: (id: BicycleId) => boolean;
  /**
   * Stores a new odometer reading and its date on the bicycle stored under `id`. The reading may be lower than the
   * current one, to correct a mistake, but not below the latest usage period boundary on the bicycle (rule 6), which is
   * `outOfRange`. Fails with only `notFound` on `id` for an unknown id. When nothing changes, the stored bicycle is
   * returned and state is not written. Reads `components` and never writes it.
   */
  setBicycleOdometer: (id: BicycleId, input: BicycleOdometerInput) => BicycleResult;
}

/** Normalized bicycle collection. `allIds` holds the display (insertion) order. */
export interface BicycleCollection {
  /** Bicycles keyed by their generated id. */
  byId: Record<BicycleId, Bicycle>;
  /** Bicycle ids in insertion order. */
  allIds: BicycleId[];
}
