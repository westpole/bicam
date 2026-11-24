import type { TextErrorCode } from '../common/types';

/** Generated component identifier (UUID v4). Assigned by `addComponent` and never changed. */
export type ComponentId = string;

/** Generated history entry identifier (UUID v4). */
export type HistoryEntryId = string;

/** Kind of component. Codes, not labels: the UI translates them. */
export type BicycleComponentType =
  | 'chain'
  | 'bottomBracket'
  | 'cassette'
  | 'frame'
  | 'seatpost'
  | 'saddle'
  | 'pedals'
  | 'wheel'
  | 'handlebar'
  | 'stem'
  | 'barTape'
  | 'tire'
  | 'frontMount'
  | 'brakes'
  | 'shifters'
  | 'derailleur';

/** One dated record in a component's history. Its data fields are added with the history actions. */
export interface ComponentHistoryEntry {
  /** Generated UUID that identifies the entry within the component. Never changes. */
  id: HistoryEntryId;
}

/**
 * A stored component. Plain JSON. Named `BicycleComponent` to avoid confusion with React's `Component`. Field limits
 * are documented in `docs/store/components.md`.
 */
export interface BicycleComponent {
  /** Generated UUID; the key bicycles use to reference this component. Never changes. */
  id: ComponentId;
  /** Kind of component. */
  type: BicycleComponentType;
  /** Free-text model. 1–60 chars, not unique. */
  model: string;
  /** History entries in insertion order. Written only by the history actions. */
  history: ComponentHistoryEntry[];
}

/** Every user-editable component field: a {@link BicycleComponent} without its generated `id` and its `history`. */
export type ComponentDetails = Omit<BicycleComponent, 'id' | 'history'>;

/** Raw component data as a form provides it. Normalized by `normalizeComponentInput` before validation. */
export interface ComponentInput {
  /** Raw value of a select; blank when nothing is chosen. */
  type: string;
  /** See {@link BicycleComponent.model}. */
  model: string;
}

/** Changes for `updateComponent`: any input field. Omitted or `undefined` keys stay unchanged. */
export type ComponentUpdate = Partial<ComponentInput>;

/** A field of {@link BicycleComponent} that a validation error can point at. */
export type ComponentField = Exclude<keyof BicycleComponent, 'history'>;

/** Why a field failed validation. Codes, not text: the UI translates them. See `docs/store/components.md` §5. */
export type ComponentErrorCode = TextErrorCode | 'invalidOption' | 'notFound';

/** One failing field. Validation reports at most one error per field. */
export interface ComponentValidationError {
  /** The failing field. */
  field: ComponentField;
  /** Why it failed. */
  code: ComponentErrorCode;
}

/** Result of validating normalized component input: details with a known type, or every failing field. */
export type ComponentValidation =
  | { ok: true; details: ComponentDetails }
  | { ok: false; errors: ComponentValidationError[] };

/**
 * Result of a component write: the stored component on success, every failing field otherwise. On success `component`
 * is the object held in the store; treat it as read-only.
 */
export type ComponentResult =
  | { ok: true; component: BicycleComponent }
  | { ok: false; errors: ComponentValidationError[] };

/** Component actions on `useAppStore`. A failed action never changes state. See `docs/store/components.md` §4. */
export interface ComponentActions {
  /**
   * Normalizes and validates `input`, generates a new id, stores the component with an empty history, and appends the
   * id to `allIds`.
   */
  addComponent: (input: ComponentInput) => ComponentResult;
  /**
   * Merges `changes` into the component stored under `id`, then normalizes and validates it. Omitted or `undefined`
   * keys are unchanged; the id, the history, and the place in `allIds` are always kept. When nothing changes, the stored
   * component is returned and state is not written. Fails with `notFound` on `id` for an unknown id.
   */
  updateComponent: (id: ComponentId, changes: ComponentUpdate) => ComponentResult;
  /**
   * Removes the component stored under `id`, including its history. Returns `false`, changing nothing, for an unknown
   * id.
   */
  removeComponent: (id: ComponentId) => boolean;
}

/** Normalized component collection. `allIds` holds the display (insertion) order. */
export interface ComponentCollection {
  /** Components keyed by their generated id. */
  byId: Record<ComponentId, BicycleComponent>;
  /** Component ids in insertion order. */
  allIds: ComponentId[];
}
