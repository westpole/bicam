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

/** Normalized bicycle collection. `allIds` holds the display (insertion) order. */
export interface BicycleCollection {
  /** Bicycles keyed by their exact id. */
  byId: Record<BicycleId, Bicycle>;
  /** Bicycle ids in insertion order. */
  allIds: BicycleId[];
}
