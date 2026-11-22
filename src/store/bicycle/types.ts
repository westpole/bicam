/** User-defined bicycle identifier, also shown as the bicycle's title. Unique case-insensitively. */
export type BicycleId = string;

/** Identifier of a component (the `components` slice is a placeholder for now). */
export type ComponentId = string;

/** ISO 8601 calendar date without time or time zone: `YYYY-MM-DD`. */
export type IsoDate = string;

/**
 * A stored bicycle. Plain JSON: unknown optional values are `null`. Field limits are documented in
 * `docs/store/bicycle.md`.
 */
export interface Bicycle {
  /** User-defined, unique (case-insensitive) id shown as the title. 1–40 chars. */
  id: BicycleId;
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
  /** Ids of the components currently installed. Unique, up to 100. */
  components: ComponentId[];
}

/**
 * Raw bicycle data as a form provides it. Normalized by `normalizeBicycleInput` before validation: strings are
 * trimmed, empty optional text becomes `null`, and a missing `components` list becomes `[]`.
 */
export interface BicycleInput {
  /** User-defined id; see {@link Bicycle.id}. */
  id: string;
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

/** Changes for `updateBicycle`: any input field except `id`. Omitted keys stay unchanged; `null` clears a field. */
export type BicycleUpdate = Partial<Omit<BicycleInput, 'id'>>;

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

/** Result of a bicycle write: the stored bicycle on success, every failing field otherwise. */
export type BicycleResult = { ok: true; bicycle: Bicycle } | { ok: false; errors: BicycleValidationError[] };

/** Normalized bicycle collection. `allIds` holds the display (insertion) order. */
export interface BicycleCollection {
  /** Bicycles keyed by their exact id. */
  byId: Record<BicycleId, Bicycle>;
  /** Bicycle ids in insertion order. */
  allIds: BicycleId[];
}
