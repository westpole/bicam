# Components slice

> **Status:** Implemented (batch #15); saved data version 2 (batch #24)
> **Owner layer:** Zustand, `src/store/components/`
> **Root key:** `components` (see [README.md](./README.md))

The `components` slice holds the parts the user tracks: chains, wheels, brakes, and so on. Each component has a type,
a free-text model, an optional label, wear limits, the periods in which it was in use, and a `history` list that records
when it was installed, how far it was ridden, and its care.

A bicycle refers to components by id (`Bicycle.components`, see [bicycle.md](./bicycle.md)). A component refers back to
bicycles only in its usage periods and in `retired` (§2.3), and those may name a bicycle that was removed.

The general rules in [README.md §2](./README.md#2-conventions) apply (plain JSON, ISO dates, `null` for unknown values,
generated ids, normalized collections, result objects).

## 1. Shape

```ts
type ComponentId = string;      // UUID v4, generated
type HistoryEntryId = string;   // UUID v4, generated
type IsoDate = string;          // 'YYYY-MM-DD'

type BicycleComponentType =
  | 'chain' | 'bottomBracket' | 'cassette' | 'frame' | 'fork' | 'seatpost' | 'saddle' | 'pedals' | 'wheel'
  | 'handlebar' | 'stem' | 'barTape' | 'tire' | 'frontMount' | 'brakes' | 'shifters' | 'derailleur';

type ComponentPosition = 'front' | 'rear';

type WheelSubcomponent = 'hub' | 'spokes' | 'rim' | 'valve';
type BrakesSubcomponent = 'lever' | 'hose' | 'caliper' | 'rotor' | 'brakePads' | 'brakeFluid';
type ShiftersSubcomponent = 'shifter' | 'hose' | 'cable' | 'derailleur';
type Subcomponent = WheelSubcomponent | BrakesSubcomponent | ShiftersSubcomponent;
type Lubricant = 'oil' | 'wax';

interface ComponentHistoryEntry {
  id: HistoryEntryId;
  date: IsoDate;                          // date of this record
  installed: IsoDate;
  distance: number | null;                // km
  position: ComponentPosition | null;     // brakes, shifters, derailleur only
  subcomponent: Subcomponent | null;      // wheel, brakes, shifters only
  lubricated: IsoDate | null;             // chain only; date of any lubrication
  stretch: number | null;                 // chain only, %
  lubricant: Lubricant | null;            // chain only; null = unknown
  cleaned: IsoDate | null;                // chain only
}

interface OdometerReading { date: IsoDate | null; odometer: number } // null = unknown date

interface ComponentUsagePeriod {
  id: UsagePeriodId;                      // UUID v4, generated
  bicycleId: BicycleId;                   // a closed period may name a removed bicycle
  start: OdometerReading;
  end: OdometerReading | null;            // null = in use now
  replacedPeriodId: UsagePeriodId | null; // the period that this start ended, for undo
}

interface ComponentLimits {
  distance: number | null;                // replace after, km
  stretch: number | null;                 // replace at, %; chain only
  lubrication: number | null;             // top up every, km; chain only
  cleaning: number | null;                // clean and relubricate every, km; chain only
}

interface BicycleComponent {
  id: ComponentId;
  type: BicycleComponentType;
  model: string;
  label: string | null;                   // not unique
  initialDistance: number;                // km before tracking; 0 for a new part
  limits: ComponentLimits;
  usage: ComponentUsagePeriod[];          // start order
  retired: { date: IsoDate; bicycleId: BicycleId } | null; // the bicycle it was retired from
  history: ComponentHistoryEntry[];       // insertion order
}

// what the component form edits; the usage actions write `usage` and `retired`
type ComponentDetails = Omit<BicycleComponent, 'id' | 'history' | 'usage' | 'retired'>;

interface ComponentCollection {
  byId: Record<ComponentId, BicycleComponent>;
  allIds: ComponentId[]; // display order = insertion order
}
```

Initial value: `{ byId: {}, allIds: [] }`.

`ComponentId` moved here from `src/store/bicycle/types.ts`, and `IsoDate` moved from there to
`src/store/common/types.ts`.

The entity is named `BicycleComponent` and its type `BicycleComponentType`, because `Component` and `ComponentType` are
also React exports.

Example:

```json
{
  "byId": {
    "0c8f2f0e-6f0b-4f0e-9a51-5d1b8a4c7a10": {
      "id": "0c8f2f0e-6f0b-4f0e-9a51-5d1b8a4c7a10",
      "type": "chain",
      "model": "Shimano CN-M8100",
      "label": "A",
      "initialDistance": 0,
      "limits": { "distance": null, "stretch": 0.5, "lubrication": 300, "cleaning": 1500 },
      "usage": [
        {
          "id": "5d0c7e1a-3b9f-4c2d-8e6a-1f2b3c4d5e6f",
          "bicycleId": "3b241101-e2bb-4255-8caf-4136c566a962",
          "start": { "date": "2026-03-01", "odometer": 1088 },
          "end": null,
          "replacedPeriodId": null
        }
      ],
      "retired": null,
      "history": [
        {
          "id": "7a1f3c52-2d8e-4b6f-8c1d-9e0f5a6b7c8d",
          "date": "2026-04-12",
          "installed": "2026-03-01",
          "distance": 412.5,
          "position": null,
          "subcomponent": null,
          "lubricated": "2026-04-12",
          "stretch": 0.25,
          "lubricant": "wax",
          "cleaned": "2026-04-12"
        }
      ]
    },
    "b5e0d6a4-93c7-4e52-a1f8-2c3d4e5f6071": {
      "id": "b5e0d6a4-93c7-4e52-a1f8-2c3d4e5f6071",
      "type": "brakes",
      "model": "Shimano GRX BR-RX820",
      "label": null,
      "initialDistance": 0,
      "limits": { "distance": null, "stretch": null, "lubrication": null, "cleaning": null },
      "usage": [],
      "retired": null,
      "history": [
        {
          "id": "e4d3c2b1-a098-4765-b432-10fedcba9876",
          "date": "2026-05-20",
          "installed": "2026-05-20",
          "distance": null,
          "position": "rear",
          "subcomponent": "brakePads",
          "lubricated": null,
          "stretch": null,
          "lubricant": null,
          "cleaned": null
        }
      ]
    }
  },
  "allIds": ["0c8f2f0e-6f0b-4f0e-9a51-5d1b8a4c7a10", "b5e0d6a4-93c7-4e52-a1f8-2c3d4e5f6071"]
}
```

## 2. Fields and limits

Text is trimmed before it is validated and stored. Lengths are counted after trimming. Limits live in
`COMPONENT_LIMITS` (`src/store/components/constants.ts`).

### 2.1 `BicycleComponent`

| Field | Type | Required | Limits | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Generated | UUID v4 | Assigned by `addComponent`; never changes and cannot be set by the caller. |
| `type` | `BicycleComponentType` | Yes | One of the 17 types | Can be changed only while the component has no usage periods and every history entry is also valid for the new type (§4). A new type replaces `limits` with that type's defaults. |
| `model` | `string` | Yes | 1–60 chars; no control characters | Free text, e.g. `'Shimano CN-M8100'`. Not unique: a rider can own two identical chains. |
| `label` | `string \| null` | No | 1–20 chars; no control characters; blank becomes `null` | Tells identical components apart (`'A'`, `'red link'`). Not unique. |
| `initialDistance` | `number` | No (defaults to 0) | 0–500 000, at most 1 decimal | Kilometres the part had before it was tracked. Cannot change once a whole-component history entry has a distance (§4), because that distance already includes it. |
| `limits` | `ComponentLimits` | No (type defaults) | `distance`, `lubrication`, `cleaning`: above 0, up to 500 000, at most 1 decimal. `stretch`: above 0, up to 5, at most 2 decimals. `null` means no limit | When the part is due for replacement or care (§2.3). `stretch`, `lubrication`, and `cleaning` are for the types in `CHAIN_CARE_TYPES` only; on another type they are `notAllowed`. A limit of 0 is `outOfRange`, because it would be due at once. |
| `usage` | `ComponentUsagePeriod[]` | Starts as `[]` | — | When the part was in use, and on which bicycle (§2.3). `updateComponent` keeps it. |
| `retired` | `{ date, bicycleId } \| null` | Starts as `null` | — | When and from which bicycle the part was retired. `updateComponent` keeps it. |
| `history` | `ComponentHistoryEntry[]` | Starts as `[]` | Up to 500 entries | Written only by the history actions (§4). Insertion order; the store does not sort it. |

### 2.2 `ComponentHistoryEntry`

| Field | Type | Required | Limits | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Generated | UUID v4 | Not in the original request. Needed to edit or remove one entry safely, and used as the React key. |
| `date` | `IsoDate` | Yes | Real `YYYY-MM-DD` date | Date of this record: when the part was installed, measured, or serviced. Not in the original request; it lets readings be followed over time. Not compared with `installed` or `lubricated`. |
| `installed` | `IsoDate` | Yes | Real `YYYY-MM-DD` date | Date the part was installed. Later records of the same installation repeat it. |
| `distance` | `number \| null` | No | 0–1 000 000, at most 1 decimal | Kilometres as of `date`. For the whole component, its own distance (§2.3), including `initialDistance`; the limit is twice the odometer's, so the total of a part that stayed on one bicycle always fits. For a subcomponent (brake pads, for example), kilometres since `installed`. `null` when unknown. |
| `position` | `'front' \| 'rear' \| null` | No | Types in §3 only | `null` when unknown or when the entry covers both ends. |
| `subcomponent` | `Subcomponent \| null` | No | Values in §3, per type | `null` when the entry is about the whole component. |
| `lubricated` | `IsoDate \| null` | No | Real `YYYY-MM-DD` date; chain only | Date the chain was waxed or lubricated. May be before `installed`, because chains are often waxed first. |
| `stretch` | `number \| null` | No | 0–5, at most 2 decimals; chain only | Chain wear in percent, as read from a chain checker (`0.5`, `0.75`). |
| `lubricant` | `'oil' \| 'wax' \| null` | No | Needs `lubricated`; chain only | What the chain was lubricated with. `null` with a `lubricated` date means unknown. |
| `cleaned` | `IsoDate \| null` | No | Real `YYYY-MM-DD` date; needs `lubricated` on the same date; chain only | Date the chain was cleaned. A cleaned chain is relubricated, so `lubricated` is then `required`, and a different date is `notAllowed` on `cleaned`. |

A **top-up** sets `lubricated` and `lubricant`. A **clean and relubrication** also sets `cleaned`. Removing a lubrication
with `updateComponentHistoryEntry` means clearing `lubricated`, `lubricant`, and `cleaned` in one call; clearing only
`lubricated` fails.

Dates in the future are not rejected, for the same reason as `Bicycle.purchased` ([README.md §6](./README.md#6-open-questions)).
Only `cleaned` is compared with another date.

### 2.3 Usage and limits

A component is **in use** while it has an open usage period (`end: null`). Its distance is derived from the bicycle's
odometer, never stored:

`distance = initialDistance + Σ ((period.end?.odometer ?? bicycle.odometer) − period.start.odometer)`

**Rule 1:** a component has at most one open period, and that period's bicycle lists the component. "In use" is never
stored separately. Loaded data is checked for it ([README.md §4](./README.md#4-persistence)). The actions that start,
stop, and swap components are not part of the store yet.

`ACTIVE_LIMITS` says how many components of a type can be in use on one bicycle:

| Types | In use per bicycle |
| --- | --- |
| `wheel`, `tire`, `brakes`, `shifters`, `derailleur` | 2 |
| `frontMount` | No limit (`null`) |
| All others, including `chain` and `cassette` | 1 |

`DEFAULT_COMPONENT_LIMITS` holds the suggested limits per type. Only `chain` has any: stretch 0.5 % (11–13-speed; 0.75 %
suits 5–10-speed), a top-up every 300 km, and a clean and relubrication every 1500 km, with no distance limit. Other types
start with `EMPTY_COMPONENT_LIMITS` (every limit `null`). `getDefaultLimits(type)` returns a copy.

## 3. Type-specific history fields

Every entry has every key. A field that does not apply to the component's type must be `null`.

| Type | `position` | `subcomponent` | `lubricated`, `stretch`, `lubricant`, `cleaned` |
| --- | --- | --- | --- |
| `chain` | — | — | Allowed |
| `wheel` | — | `hub`, `spokes`, `rim`, `valve` | — |
| `brakes` | Allowed | `lever`, `hose`, `caliper`, `rotor`, `brakePads`, `brakeFluid` | — |
| `shifters` | Allowed | `shifter`, `hose`, `cable`, `derailleur` | — |
| `derailleur` | Allowed | — | — |
| All other types | — | — | — |

The rules are data in `src/store/components/constants.ts`, so changing one is a one-line edit:

```ts
const COMPONENT_POSITIONS: readonly ComponentPosition[] = ['front', 'rear'];
const POSITION_TYPES: readonly BicycleComponentType[] = ['brakes', 'shifters', 'derailleur'];
const CHAIN_CARE_TYPES: readonly BicycleComponentType[] = ['chain'];
const SUBCOMPONENTS: Readonly<Partial<Record<BicycleComponentType, readonly Subcomponent[]>>> = { /* table above */ };
const LUBRICANTS: readonly Lubricant[] = ['oil', 'wax'];
const ACTIVE_LIMITS: Readonly<Record<BicycleComponentType, number | null>> = { /* §2.3 */ };
const DEFAULT_COMPONENT_LIMITS: Readonly<Partial<Record<BicycleComponentType, Readonly<ComponentLimits>>>> = { /* §2.3 */ };
```

Stored values are codes, not labels. The UI translates them with `t()`.

## 4. Input, normalization, and actions

```ts
interface ComponentInput {
  type: string;                       // raw value from a select; '' when nothing is chosen
  model: string;
  label?: string | null;              // missing, null, or blank: no label
  initialDistance?: number;           // missing: 0 when adding, the stored value in an update
  limits?: Partial<ComponentLimits>;  // a missing key: see below; null: no limit
}
type ComponentUpdate = Partial<ComponentInput>;

interface ComponentHistoryInput {
  date: string;
  installed: string;
  distance?: number | null;
  position?: string | null;
  subcomponent?: string | null;
  lubricated?: string | null;
  stretch?: number | null;
  lubricant?: string | null;
  cleaned?: string | null;
}
type ComponentHistoryUpdate = Partial<ComponentHistoryInput>;
```

Normalization runs before validation:

1. Pick known fields only (`id`, `history`, `usage`, `retired`, and any other extra key are dropped; so are unknown
   keys of `limits`).
2. Trim every string.
3. Optional text that is missing, `null`, or blank becomes `null`. A missing history number becomes `null`.
4. `-0` becomes `0`, because `-0` does not survive a JSON round trip.
5. Component input is completed from a base before validation (`normalizeComponentInput`): a missing
   `initialDistance` or limit takes the base value. `addComponent` uses 0 and the type's defaults; `updateComponent`
   uses the stored values, or, when the type changes, the new type's default limits.

In updates, `null` (or blank text) clears an optional field. An omitted or `undefined` key is unchanged.

| Action | Returns | Behavior |
| --- | --- | --- |
| `addComponent(input)` | `ComponentResult` | Validates, generates an `id`, and appends the id to `allIds`. Stores the component with `usage: []`, `retired: null`, and `history: []`. A missing `initialDistance` is 0, and missing limits take the type's defaults. |
| `updateComponent(id, changes)` | `ComponentResult` | Changes `type`, `model`, `label`, `initialDistance`, and single limits. Keeps `id`, `usage`, `retired`, `history`, and the place in `allIds`; such keys in `changes` are ignored. Omitted limits keep their stored values, unless the type changes: then they start from the new type's defaults. State is not written when nothing changes. A new `type` is rejected with `{ field: 'type', code: 'notAllowed' }` once the component has usage periods, or when any stored entry fails validation for it, whatever that entry's own error code is. A new `initialDistance` is rejected with `{ field: 'initialDistance', code: 'notAllowed' }` once a whole-component history entry has a distance; the unchanged value is accepted. |
| `removeComponent(id)` | `boolean` | Removes the component and its history. `false` for an unknown id. The wrapper in `useAppStore.ts` also removes the id from every `Bicycle.components` (see [Links between slices](#links-between-slices)). |
| `addComponentHistoryEntry(componentId, input)` | `ComponentHistoryResult` | Validates against the component's type, generates an entry `id`, and appends the entry. |
| `updateComponentHistoryEntry(componentId, entryId, changes)` | `ComponentHistoryResult` | Merges, normalizes, and validates. Keeps the entry's `id` and place. |
| `removeComponentHistoryEntry(componentId, entryId)` | `boolean` | Removes one entry. `false` for an unknown component or entry. |

A failed action never changes state and does not call `set`. Lookups by component id use an own-property check
(`hasComponent`), as `hasBicycle` does.

### Links between slices

- `addBicycle` and `updateBicycle` reject a component id that is not stored, with
  `{ field: 'components', code: 'notFound' }`, and one that is on another bicycle with
  `{ field: 'components', code: 'alreadyInstalled' }`. The bicycle slice may read `components`; it never writes it.
- `removeComponent` is wrapped in `useAppStore.ts`. The wrapper returns `false` for an unknown id; otherwise it removes
  the id from the bicycles that list it, then calls the slice action. In this order no subscriber sees a bicycle that
  points at a missing component. The slices still write only their own key.
- `addComponentToBicycle(bicycleId, input)` lives in `useAppStore.ts`. It stores a new component, then appends its id to
  the bicycle. It returns `BicycleComponentResult` (`src/store/types.ts`): `ComponentResult` plus two errors that are
  checked before the input and returned alone, `{ field: 'bicycleId', code: 'notFound' }` and
  `{ field: 'components', code: 'tooMany' }`. Nothing is stored on failure. A component that is already stored is added
  with `updateBicycle`.
- `getInstalledComponents` lists a bicycle's components; `getSpareComponents` lists the components on no bicycle.
- `removeBicycle` does not remove components: a rider keeps the parts when a bicycle goes.

## 5. Results and error codes

```ts
type ComponentField =
  | 'id' | 'type' | 'model' | 'label' | 'initialDistance'
  | 'limits.distance' | 'limits.stretch' | 'limits.lubrication' | 'limits.cleaning';
type ComponentHistoryField = keyof ComponentHistoryEntry | 'componentId' | 'history';

type ComponentErrorCode =
  | 'required' | 'tooLong' | 'invalidFormat' | 'invalidOption' | 'outOfRange' | 'notAllowed' | 'tooMany' | 'notFound';

interface ComponentValidationError { field: ComponentField; code: ComponentErrorCode }
interface ComponentHistoryValidationError { field: ComponentHistoryField; code: ComponentErrorCode }

type ComponentResult =
  | { ok: true; component: BicycleComponent }
  | { ok: false; errors: ComponentValidationError[] };

type ComponentHistoryResult =
  | { ok: true; entry: ComponentHistoryEntry }
  | { ok: false; errors: ComponentHistoryValidationError[] };
```

| Code | Raised when |
| --- | --- |
| `required` | `type`, `model`, `date`, or `installed` is empty after trimming, or `lubricated` is missing while `cleaned` is a valid date. |
| `tooLong` | `model` is over 60 characters, or `label` over 20. |
| `invalidFormat` | `model` or `label` has a control character; a date is not a real `YYYY-MM-DD` date; a number is not finite or has too many decimals. |
| `invalidOption` | `type`, `position`, `subcomponent`, or `lubricant` is not one of its allowed values. A subcomponent of another type (`rim` on `brakes`) is also `invalidOption`. |
| `outOfRange` | A number (`distance`, `stretch`, `initialDistance`, or a limit) is negative or above its maximum, or a limit is 0. |
| `notAllowed` | A history field is set on a type that does not have it (§3); `lubricant` is set without `lubricated`; `cleaned` is not the same date as `lubricated`; a chain-only limit is set on another type; a type change conflicts with stored history or usage periods; or a new `initialDistance` conflicts with a stored history distance. |
| `tooMany` | The component already has 500 history entries (field `history`). |
| `notFound` | Unknown component (field `id` for component actions, `componentId` for history actions) or unknown entry (field `id`). |

Validation reports every failing field at once, at most one error per field, in field order (for components,
`COMPONENT_FIELD_ORDER`). For one field, `notAllowed` is checked first. Numbers are then checked in the order finite, range, decimals.

`notFound` and `tooMany` are checked before the input and are always returned alone. Only `addComponentHistoryEntry`
returns `tooMany`, so entries of a full history can still be edited. `notFound` comes first; for history
actions, an unknown component comes before an unknown entry.

On success, the returned object is the one held in the store; treat it as read-only.

## 6. Decisions

| Decision | Reason |
| --- | --- |
| `history` is stored inside the component. | The request defines it as an array on the entity, and it is never read without its component. The root `history` key stays a placeholder. |
| A history entry is one flat object with `null` for fields that do not apply, not a union per type. | One shape is simpler to store, migrate, and bind to a form. The validator enforces the per-type rules from one table. |
| A history entry is a log record with its own `date`. Waxing a chain again adds an entry with the same `installed` date. | The request gives each entry one waxed date. One record per event keeps all past values, and `date` says when each distance or stretch was read. |
| Values are normalized to camelCase codes: `bar tape` → `barTape`, `level` → `lever`, `calliper` → `caliper`, `waxed/lubricated date` → `lubricated`. | Codes are stable keys for translation. `level` is a typo for `lever` (confirmed by the user). |
| `gear shifter` in the request means the `shifters` type. | It is the only shifter type in the list. |
| `distance` is not the bicycle's odometer reading. For a whole component it is the component's own distance (§2.3), including `initialDistance`; for a subcomponent it is kilometres since `installed`. | Confirmed by the user (batch #24). It stays correct when a part moves between bicycles, and it differs from "since installed" for used parts and for a part that came off and went back on. |
| A component's distance is derived from usage periods and the bicycle's odometer, never stored. | A late swap would otherwise credit the wrong chain. An `isActive` flag next to the periods could disagree with them. |
| Each lubrication records `oil` or `wax` on the history entry, not on the component. | A chain can change lubricant. |
| Limits are stored per component, starting from the type's defaults. | Wear limits depend on the drivetrain, so the rider can change them. |
| `wheel` and `tire` have no `position`. | Confirmed by the user, as in the request. |
| `derailleur` is both a component type and a subcomponent of `shifters`. | Confirmed by the user, as in the request. The same part can then be logged in two places. |
| One date, `lubricated`, covers waxing, lubrication, and the relubrication after a clean. | Confirmed by the user. |
| `stretch` is a percentage, 0–5, as on a chain checker. | Confirmed by the user. |
| A component is on at most one bicycle. `addBicycle` and `updateBicycle` enforce it. | A part is physically on one bicycle at a time (confirmed by the user). The shared validator covers every caller, not only the details screen. To move a part, take it off the first bicycle, then add it to the other. |
