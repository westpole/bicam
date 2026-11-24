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
  /** Ids of the components currently installed. Stored components only, unique, up to 100. */
  components: ComponentId[];
}

/** Every user-editable bicycle field: a {@link Bicycle} without its generated `id`. */
export type BicycleDetails = Omit<Bicycle, 'id'>;

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

/** A field of {@link Bicycle} that a validation error can point at. */
export type BicycleField = keyof Bicycle;

/** Why a field failed validation. Codes, not text: the UI translates them. See `docs/store/bicycle.md` §5. */
export type BicycleErrorCode = 'required' | 'tooLong' | 'invalidFormat' | 'tooMany' | 'duplicate' | 'notFound';

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

/** Bicycle actions on `useAppStore`. A failed action never changes state. See `docs/store/bicycle.md` §4. */
export interface BicycleActions {
  /**
   * Normalizes and validates `input`, generates a new id, stores the bicycle, and appends the id to `allIds`. Fails
   * with `duplicate` on `name` when another bicycle has the same name, ignoring case, and with `notFound` on
   * `components` when a listed component is not stored.
   */
  addBicycle: (input: BicycleInput) => BicycleResult;
  /**
   * Merges `changes` into the bicycle stored under `id`, then normalizes and validates it. Renaming is allowed; the
   * new name must not clash with another bicycle's name. `null` clears an optional field; omitted or `undefined`
   * keys are unchanged. Fails with `notFound` on `id` for an unknown id, and on `components` when a listed component
   * is not stored.
   */
  updateBicycle: (id: BicycleId, changes: BicycleUpdate) => BicycleResult;
  /** Removes the bicycle stored under `id`. Returns `false`, changing nothing, for an unknown id. */
  removeBicycle: (id: BicycleId) => boolean;
}

/** Normalized bicycle collection. `allIds` holds the display (insertion) order. */
export interface BicycleCollection {
  /** Bicycles keyed by their generated id. */
  byId: Record<BicycleId, Bicycle>;
  /** Bicycle ids in insertion order. */
  allIds: BicycleId[];
}
