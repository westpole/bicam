import type { BicycleCollection, BicycleId } from '../bicycle/types';
import type { IsoDate, TextErrorCode } from '../common/types';

/** Generated component identifier (UUID v4). Assigned by `addComponent` and never changed. */
export type ComponentId = string;

/** Generated history entry identifier (UUID v4). */
export type HistoryEntryId = string;

/** Generated usage period identifier (UUID v4). */
export type UsagePeriodId = string;

/** Kind of component. Codes, not labels: the UI translates them. */
export type BicycleComponentType =
  | 'chain'
  | 'bottomBracket'
  | 'cassette'
  | 'frame'
  | 'fork'
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

/** What a chain was lubricated with. Codes, not labels: the UI translates them. */
export type Lubricant = 'oil' | 'wax';

/** A bicycle's odometer at one moment. */
export interface OdometerReading {
  /** Date of the reading, or `null` when unknown (for example, set by the migration from version 1). */
  date: IsoDate | null;
  /** The bicycle's odometer in kilometres. */
  odometer: number;
}

/**
 * A stretch of time in which a component was in use on one bicycle. A component's distance is derived from its
 * periods; it is never stored. Documented in `docs/store/components.md` §2.3.
 */
export interface ComponentUsagePeriod {
  /** Generated UUID. Never changes. */
  id: UsagePeriodId;
  /** The bicycle it was in use on. A closed period may name a removed bicycle. */
  bicycleId: BicycleId;
  /** When it was put in use. */
  start: OdometerReading;
  /** When it stopped, or `null` while it is in use. A component has at most one open period. */
  end: OdometerReading | null;
  /** The period that this start ended (a swap), for undo, or `null`. Never looked up when data is loaded. */
  replacedPeriodId: UsagePeriodId | null;
}

/**
 * When a component is due for replacement or care, in kilometres or percent; `null` means no limit. Stored per
 * component, starting from the defaults of its type (`DEFAULT_COMPONENT_LIMITS`).
 */
export interface ComponentLimits {
  /** Replace after this many kilometres. */
  distance: number | null;
  /** Replace at this chain stretch, in percent. Chain only. */
  stretch: number | null;
  /** Top up the lubricant every this many kilometres. Chain only. */
  lubrication: number | null;
  /** Clean and relubricate every this many kilometres. Chain only. */
  cleaning: number | null;
}

/** Suggested limits per type; a type that is not listed has none. */
export type ComponentLimitsByType = Partial<Record<BicycleComponentType, Readonly<ComponentLimits>>>;

/** When and from which bicycle a component was retired. */
export interface ComponentRetirement {
  /** Date it was retired. */
  date: IsoDate;
  /** The bicycle it was taken off. Never looked up when data is loaded, because it may have been removed. */
  bicycleId: BicycleId;
}

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
  /**
   * Kilometres as of `date`, or `null` when unknown. For the whole component: its own distance, including
   * `initialDistance`. For a subcomponent: kilometres since `installed`.
   */
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
  /**
   * What the chain was lubricated with on `lubricated`, or `null` when unknown. Needs `lubricated`. Only for the types
   * in `CHAIN_CARE_TYPES`.
   */
  lubricant: Lubricant | null;
  /**
   * Date the chain was cleaned, or `null`. A cleaned chain is relubricated, so it needs `lubricated` on the same date.
   * Only for the types in `CHAIN_CARE_TYPES`.
   */
  cleaned: IsoDate | null;
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
  /** Raw value of a select; missing, `null`, or blank means unknown. */
  lubricant?: string | null;
  /** Date the chain was cleaned; missing, `null`, or blank means not recorded. */
  cleaned?: string | null;
}

/** Changes for `updateComponentHistoryEntry`: any input field. Omitted or `undefined` keys stay unchanged. */
export type ComponentHistoryUpdate = Partial<ComponentHistoryInput>;

/**
 * Output of `normalizeComponentHistoryInput`: {@link ComponentHistoryDetails} whose options are not checked yet. A
 * stored {@link ComponentHistoryEntry} fits too, so it can be validated again for another type.
 */
export interface NormalizedComponentHistoryInput extends Omit<
  ComponentHistoryDetails,
  'position' | 'subcomponent' | 'lubricant'
> {
  /** Trimmed, not blank; not yet known to be a {@link ComponentPosition}. */
  position: string | null;
  /** Trimmed, not blank; not yet known to be a {@link Subcomponent}. */
  subcomponent: string | null;
  /** Trimmed, not blank; not yet known to be a {@link Lubricant}. */
  lubricant: string | null;
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
  /** Tells identical components apart (`'A'`, `'red link'`), or `null`. 1–20 chars, not unique. */
  label: string | null;
  /** Kilometres the part had before it was tracked; `0` for a new part. */
  initialDistance: number;
  /** When it is due for replacement or care. */
  limits: ComponentLimits;
  /** Usage periods in the order they started. At most one is open, and its bicycle lists this component. */
  usage: ComponentUsagePeriod[];
  /** When and from which bicycle it was retired, or `null` when it is not retired. */
  retired: ComponentRetirement | null;
  /** History entries in insertion order. Written only by the history actions. */
  history: ComponentHistoryEntry[];
}

/**
 * Every user-editable component field: a {@link BicycleComponent} without its generated `id`, its `history`, and the
 * fields that the usage actions write.
 */
export type ComponentDetails = Omit<BicycleComponent, 'id' | 'history' | 'usage' | 'retired'>;

/** Raw component data as a form provides it. Normalized by `normalizeComponentInput` before validation. */
export interface ComponentInput {
  /** Raw value of a select; blank when nothing is chosen. */
  type: string;
  /** See {@link BicycleComponent.model}. */
  model: string;
  /** See {@link BicycleComponent.label}. Missing, `null`, or blank means no label. */
  label?: string | null;
  /** Kilometres; missing means 0 for a new component, and the stored value in an update. */
  initialDistance?: number;
  /**
   * Limits to set. A missing key takes the type's default for a new component, and the stored value in an update (the
   * new type's default after a type change). `null` means no limit.
   */
  limits?: Partial<ComponentLimits>;
}

/** Changes for `updateComponent`: any input field. Omitted or `undefined` keys stay unchanged. */
export type ComponentUpdate = Partial<ComponentInput>;

/** Values that `normalizeComponentInput` takes for the fields the input leaves out. */
export type ComponentInputBase = Pick<ComponentDetails, 'initialDistance' | 'limits'>;

/**
 * Output of `normalizeComponentInput`: complete {@link ComponentDetails} whose type is not checked yet. A stored
 * component fits too.
 */
export interface NormalizedComponentInput extends Omit<ComponentDetails, 'type'> {
  /** Trimmed; not yet known to be a {@link BicycleComponentType}. */
  type: string;
}

/** A limit as a validation error names it. */
export type ComponentLimitField = `limits.${keyof ComponentLimits}`;

/** A field of {@link BicycleComponent} that a validation error can point at. */
export type ComponentField = 'id' | 'type' | 'model' | 'label' | 'initialDistance' | ComponentLimitField;

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

/** An odometer reading as a form provides it, for the usage actions. Normalized before validation. */
export interface ComponentReadingInput {
  /** `YYYY-MM-DD` of the reading; `null` or blank means unknown. The store has no clock, so the UI supplies today. */
  date: string | null;
  /** The bicycle's odometer at that moment, in kilometres. */
  odometer: number;
}

/** Input of `startComponentUse`: when the component went into use, and what it replaced, if anything. */
export interface ComponentStartInput extends ComponentReadingInput {
  /**
   * The component in use on the same bicycle that this one replaces (a swap). Required when the type is full; also
   * allowed when there is room. Missing, `null`, or `''` means none.
   */
  replaces?: ComponentId | null;
}

/** Input of `stopComponentUse`: when the component went out of use. */
export type ComponentStopInput = ComponentReadingInput;

/**
 * A field that a usage validation error can point at: an argument of the action (`bicycleId`, `componentId`), a field
 * of its input (`replaces`, `odometer`, `date`), or the component's whole `usage` list.
 */
export type ComponentUsageField = 'bicycleId' | 'componentId' | 'replaces' | 'odometer' | 'date' | 'usage';

/** One failing usage field. Validation reports at most one error per field. */
export interface ComponentUsageValidationError {
  /** The failing field. */
  field: ComponentUsageField;
  /** Why it failed. */
  code: ComponentErrorCode;
}

/**
 * Result of a usage action: the started or stopped component on success, every failing field otherwise. On success
 * `component` is the object held in the store; treat it as read-only.
 */
export type ComponentUsageResult =
  | { ok: true; component: BicycleComponent }
  | { ok: false; errors: ComponentUsageValidationError[] };

/**
 * A validated usage change that is not written yet: the component the action is about, and every component it
 * changes (for a swap, also the replaced one). Writing `changed` in one `set` applies it.
 */
export type ComponentUsagePlan =
  | { ok: true; component: BicycleComponent; changed: readonly BicycleComponent[] }
  | { ok: false; errors: ComponentUsageValidationError[] };

/** A field that an assign error can point at: a usage field, or `components` for a full bicycle. */
export type ComponentAssignField = ComponentUsageField | 'components';

/** One failing assign field. At most one error per field. */
export interface ComponentAssignValidationError {
  /** The failing field. */
  field: ComponentAssignField;
  /** Why it failed. */
  code: ComponentErrorCode;
}

/**
 * A validated assign (link, and optionally start) that is not written yet: the assigned component as it will be
 * stored, and both next collections. Writing them in one `set` applies it (rule 11).
 */
export type ComponentAssignPlan =
  | { ok: true; component: BicycleComponent; bicycles: BicycleCollection; components: ComponentCollection }
  | { ok: false; errors: ComponentAssignValidationError[] };

/**
 * A validated `addComponent` that is not written yet: the new component and the collection that holds it. Writing
 * `collection` applies it, so the store can write other keys in the same `set`.
 */
export type ComponentAddPlan =
  | { ok: true; component: BicycleComponent; collection: ComponentCollection }
  | { ok: false; errors: ComponentValidationError[] };

/** A usage period reduced to its readings, half-open: `[start, end)`; `end: null` means it is still open. */
export interface UsageInterval {
  /** The odometer reading where it starts. */
  start: number;
  /** The odometer reading where it ends, or `null` while open. */
  end: number | null;
}

/**
 * A component's derived distance and chain care state, as `getComponentUsage` returns it. Distances are kilometres,
 * rounded to 1 decimal. A limit is reached when a value is at or above it; this object does not decide that. Documented
 * in `docs/store/components.md` §2.4.
 */
export interface ComponentUsage {
  /** All its usage, plus `initialDistance`. */
  distance: number;
  /** Distance in the open period, or `null` when it is not in use. */
  distanceSinceInstalled: number | null;
  /** Whether it has an open usage period. */
  isInUse: boolean;
  /** Stretch in percent from the newest entry that has one, or `null` (also for types without chain care). */
  stretch: number | null;
  /** Lubricant of the newest lubrication, or `null` when unknown or none. */
  lubricant: Lubricant | null;
  /** Distance since the newest lubrication (top-up or clean), never below 0; `null` when unknown. */
  distanceSinceLubrication: number | null;
  /** Distance since the newest clean, never below 0; `null` when unknown. Top-ups do not change it. */
  distanceSinceCleaning: number | null;
}

/** Component actions on `useAppStore`. A failed action never changes state. See `docs/store/components.md` §4. */
export interface ComponentActions {
  /**
   * Normalizes and validates `input`, generates a new id, and appends the id to `allIds`. The component is stored with
   * no usage and an empty history. A missing `initialDistance` is 0, and missing limits take the defaults of the type.
   */
  addComponent: (input: ComponentInput) => ComponentResult;
  /**
   * Merges `changes` into the component stored under `id`, then normalizes and validates it. Omitted or `undefined`
   * keys are unchanged, and so are omitted limits; the id, `usage`, `retired`, the history, and the place in `allIds`
   * are always kept, and such keys in `changes` are ignored. A new type starts from that type's default limits, before
   * `changes.limits` applies. When nothing changes, the stored component is returned and state is not written. Fails
   * with `notFound` on `id` for an unknown id; with `notAllowed` on `type` for a new type once the component has usage
   * periods or when any stored history entry is not valid for it; and with `notAllowed` on `initialDistance` for a new
   * value once a whole-component history entry has a distance.
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
  /**
   * Puts the component in use on the bicycle at the given reading (rules 3, 4, and 7 in `docs/store/components.md`
   * §2.3). Adds an open period, or reopens the component's last period when it ended at that reading on this bicycle.
   * With `replaces`, the replaced component's open period ends at the same reading, in the same `set`; a zero-length
   * period is dropped. Fails with only `notFound` on `bicycleId` or `componentId` for an unknown id. Reads `bicycle`;
   * writes only `components`.
   */
  startComponentUse: (
    bicycleId: BicycleId,
    componentId: ComponentId,
    input: ComponentStartInput,
  ) => ComponentUsageResult;
  /**
   * Takes the component out of use: closes its open period at the given reading, between the period's start and the
   * bicycle's odometer (rule 5). A zero-length period is dropped. Fails with only `notFound` on `componentId` for an
   * unknown id, and with `notAllowed` on `componentId` when it is not in use.
   */
  stopComponentUse: (componentId: ComponentId, input: ComponentStopInput) => ComponentUsageResult;
}

/** Normalized component collection. `allIds` holds the display (insertion) order. */
export interface ComponentCollection {
  /** Components keyed by their generated id. */
  byId: Record<ComponentId, BicycleComponent>;
  /** Component ids in insertion order. */
  allIds: ComponentId[];
}
