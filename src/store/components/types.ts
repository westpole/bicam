import type { IsoDate, TextErrorCode } from '../common/types';

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

/** End of the bicycle a history entry is about. */
export type ComponentPosition = 'front' | 'rear';

/** Part of a `wheel`. */
export type WheelSubcomponent = 'hub' | 'spokes' | 'rim' | 'valve';

/** Part of `brakes`. */
export type BrakesSubcomponent = 'lever' | 'hose' | 'caliper' | 'rotor' | 'brakePads' | 'brakeFluid';

/** Part of `shifters`. */
export type ShiftersSubcomponent = 'shifter' | 'hose' | 'cable' | 'derailleur';

/** Part of a component that a history entry is about. Codes, not labels: the UI translates them. */
export type Subcomponent = WheelSubcomponent | BrakesSubcomponent | ShiftersSubcomponent;

/**
 * One dated record in a component's history. Plain JSON: unknown optional values are `null`. Field limits are
 * documented in `docs/store/components.md` §2.2.
 */
export interface ComponentHistoryEntry {
  /** Generated UUID that identifies the entry within the component. Never changes. */
  id: HistoryEntryId;
  /** Date of this record. Not compared with `installed`. */
  date: IsoDate;
  /** Date the part was installed. Later records of the same installation repeat it. */
  installed: IsoDate;
  /** Kilometres ridden on the part since `installed`, as of `date`, or `null` when unknown. */
  distance: number | null;
  /** End of the bicycle, or `null` when unknown or both. Only for the types in `POSITION_TYPES`. */
  position: ComponentPosition | null;
  /** Part of the component, or `null` for the whole component. Only for the types in `SUBCOMPONENTS`. */
  subcomponent: Subcomponent | null;
  /**
   * Date the chain was waxed or lubricated, or `null`. Not compared with `installed`. Only for the types in
   * `CHAIN_CARE_TYPES`.
   */
  lubricated: IsoDate | null;
  /** Chain wear in percent, or `null` when not measured. Only for the types in `CHAIN_CARE_TYPES`. */
  stretch: number | null;
}

/** Every user-editable history field: a {@link ComponentHistoryEntry} without its generated `id`. */
export type ComponentHistoryDetails = Omit<ComponentHistoryEntry, 'id'>;

/** Raw history entry data as a form provides it. Normalized by `normalizeComponentHistoryInput` before validation. */
export interface ComponentHistoryInput {
  /** See {@link ComponentHistoryEntry.date}. */
  date: string;
  /** See {@link ComponentHistoryEntry.installed}. */
  installed: string;
  /** Kilometres; missing or `null` means unknown. */
  distance?: number | null;
  /** Raw value of a select; missing, `null`, or blank means unknown or both ends. */
  position?: string | null;
  /** Raw value of a select; missing, `null`, or blank means the whole component. */
  subcomponent?: string | null;
  /** Date the chain was waxed or lubricated; missing, `null`, or blank means not recorded. */
  lubricated?: string | null;
  /** Chain wear in percent; missing or `null` means not measured. */
  stretch?: number | null;
}

/** Changes for `updateComponentHistoryEntry`: any input field. Omitted or `undefined` keys stay unchanged. */
export type ComponentHistoryUpdate = Partial<ComponentHistoryInput>;

/**
 * Output of `normalizeComponentHistoryInput`: {@link ComponentHistoryDetails} whose options are not checked yet. A
 * stored {@link ComponentHistoryEntry} fits too, so it can be validated again for another type.
 */
export interface NormalizedComponentHistoryInput extends Omit<ComponentHistoryDetails, 'position' | 'subcomponent'> {
  /** Trimmed, not blank; not yet known to be a {@link ComponentPosition}. */
  position: string | null;
  /** Trimmed, not blank; not yet known to be a {@link Subcomponent}. */
  subcomponent: string | null;
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
export type ComponentErrorCode =
  | TextErrorCode
  | 'invalidOption'
  | 'outOfRange'
  | 'notAllowed'
  | 'tooMany'
  | 'notFound';

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

/**
 * A field that a history validation error can point at: a field of {@link ComponentHistoryEntry}, the component the
 * caller named, or its whole history.
 */
export type ComponentHistoryField = keyof ComponentHistoryEntry | 'componentId' | 'history';

/** One failing history field. Validation reports at most one error per field. */
export interface ComponentHistoryValidationError {
  /** The failing field. */
  field: ComponentHistoryField;
  /** Why it failed. */
  code: ComponentErrorCode;
}

/** Result of validating normalized history input: details with known options, or every failing field. */
export type ComponentHistoryValidation =
  | { ok: true; details: ComponentHistoryDetails }
  | { ok: false; errors: ComponentHistoryValidationError[] };

/** Result of checking one optional value against a list of options. */
export interface OptionCheck<T extends string> {
  /** The matching option, or `null` when there is no value or it failed. */
  value: T | null;
  /** Why the value failed, or `null` when it is valid. */
  code: ComponentErrorCode | null;
}

/**
 * Result of a history write: the stored entry on success, every failing field otherwise. On success `entry` is the
 * object held in the store; treat it as read-only.
 */
export type ComponentHistoryResult =
  | { ok: true; entry: ComponentHistoryEntry }
  | { ok: false; errors: ComponentHistoryValidationError[] };

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
   * component is returned and state is not written. Fails with `notFound` on `id` for an unknown id, and with
   * `notAllowed` on `type` for a new type that any stored history entry is not valid for.
   */
  updateComponent: (id: ComponentId, changes: ComponentUpdate) => ComponentResult;
  /**
   * Removes the component stored under `id`, including its history, and its id from every bicycle that lists it.
   * Returns `false`, changing nothing, for an unknown id.
   */
  removeComponent: (id: ComponentId) => boolean;
  /**
   * Normalizes and validates `input` for the type of the component stored under `componentId`, generates a new entry
   * id, and appends the entry to that component's history. Before the input is checked, fails with only `notFound` on
   * `componentId` for an unknown component, or only `tooMany` on `history` when its history is full.
   */
  addComponentHistoryEntry: (componentId: ComponentId, input: ComponentHistoryInput) => ComponentHistoryResult;
  /**
   * Merges `changes` into one history entry, then normalizes and validates it for the component's type. Omitted or
   * `undefined` keys are unchanged; `null` or blank text clears an optional field; the entry's id and place are always
   * kept. Before the changes are checked, fails with only `notFound`: on `componentId` for an unknown component, or on
   * `id` for an entry that is not in that component's history.
   */
  updateComponentHistoryEntry: (
    componentId: ComponentId,
    entryId: HistoryEntryId,
    changes: ComponentHistoryUpdate,
  ) => ComponentHistoryResult;
  /**
   * Removes one entry from the history of the component stored under `componentId`. Returns `false`, changing nothing,
   * for an unknown component or an entry that is not in its history.
   */
  removeComponentHistoryEntry: (componentId: ComponentId, entryId: HistoryEntryId) => boolean;
}

/** Normalized component collection. `allIds` holds the display (insertion) order. */
export interface ComponentCollection {
  /** Components keyed by their generated id. */
  byId: Record<ComponentId, BicycleComponent>;
  /** Component ids in insertion order. */
  allIds: ComponentId[];
}
