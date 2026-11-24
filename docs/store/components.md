# Components slice

> **Status:** In progress (batch #15, `addComponent`, `updateComponent`, `removeComponent`, and `addComponentHistoryEntry`
> implemented, see [tickets/plan.md](../../tickets/plan.md))
> **Owner layer:** Zustand, `src/store/components/`
> **Root key:** `components` (see [README.md](./README.md))

The `components` slice holds the parts the user tracks: chains, wheels, brakes, and so on. Each component has a type,
a free-text model, and a `history` list that records when it was installed, how far it was ridden, and its care.

A bicycle refers to components by id (`Bicycle.components`, see [bicycle.md](./bicycle.md)). Components do not refer
back to bicycles.

The general rules in [README.md §2](./README.md#2-conventions) apply (plain JSON, ISO dates, `null` for unknown values,
generated ids, normalized collections, result objects).

## 1. Shape

```ts
type ComponentId = string;      // UUID v4, generated
type HistoryEntryId = string;   // UUID v4, generated
type IsoDate = string;          // 'YYYY-MM-DD'

type BicycleComponentType =
  | 'chain' | 'bottomBracket' | 'cassette' | 'frame' | 'seatpost' | 'saddle' | 'pedals' | 'wheel'
  | 'handlebar' | 'stem' | 'barTape' | 'tire' | 'frontMount' | 'brakes' | 'shifters' | 'derailleur';

type ComponentPosition = 'front' | 'rear';

type WheelSubcomponent = 'hub' | 'spokes' | 'rim' | 'valve';
type BrakesSubcomponent = 'lever' | 'hose' | 'caliper' | 'rotor' | 'brakePads' | 'brakeFluid';
type ShiftersSubcomponent = 'shifter' | 'hose' | 'cable' | 'derailleur';
type Subcomponent = WheelSubcomponent | BrakesSubcomponent | ShiftersSubcomponent;

interface ComponentHistoryEntry {
  id: HistoryEntryId;
  date: IsoDate;                          // date of this record
  installed: IsoDate;
  distance: number | null;                // km
  position: ComponentPosition | null;     // brakes, shifters, derailleur only
  subcomponent: Subcomponent | null;      // wheel, brakes, shifters only
  lubricated: IsoDate | null;             // chain only
  stretch: number | null;                 // chain only, %
}

interface BicycleComponent {
  id: ComponentId;
  type: BicycleComponentType;
  model: string;
  history: ComponentHistoryEntry[];       // insertion order
}

interface ComponentCollection {
  byId: Record<ComponentId, BicycleComponent>;
  allIds: ComponentId[]; // display order = insertion order
}
```

Initial value: `{ byId: {}, allIds: [] }`.

`ComponentId` and `IsoDate` are not new. `ComponentId` moved here from `src/store/bicycle/types.ts` in #22, and
`IsoDate` moved from there to `src/store/common/types.ts` in #24.

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
      "history": [
        {
          "id": "7a1f3c52-2d8e-4b6f-8c1d-9e0f5a6b7c8d",
          "date": "2026-04-12",
          "installed": "2026-03-01",
          "distance": 412.5,
          "position": null,
          "subcomponent": null,
          "lubricated": "2026-04-12",
          "stretch": 0.25
        }
      ]
    },
    "b5e0d6a4-93c7-4e52-a1f8-2c3d4e5f6071": {
      "id": "b5e0d6a4-93c7-4e52-a1f8-2c3d4e5f6071",
      "type": "brakes",
      "model": "Shimano GRX BR-RX820",
      "history": [
        {
          "id": "e4d3c2b1-a098-4765-b432-10fedcba9876",
          "date": "2026-05-20",
          "installed": "2026-05-20",
          "distance": null,
          "position": "rear",
          "subcomponent": "brakePads",
          "lubricated": null,
          "stretch": null
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
| `type` | `BicycleComponentType` | Yes | One of the 16 types | Can be changed only while every history entry is also valid for the new type (§4). |
| `model` | `string` | Yes | 1–60 chars; no control characters | Free text, e.g. `'Shimano CN-M8100'`. Not unique: a rider can own two identical chains. |
| `history` | `ComponentHistoryEntry[]` | Starts as `[]` | Up to 500 entries | Written only by the history actions (§4). Insertion order; the store does not sort it. |

### 2.2 `ComponentHistoryEntry`

| Field | Type | Required | Limits | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Generated | UUID v4 | Not in the original request. Needed to edit or remove one entry safely, and used as the React key. |
| `date` | `IsoDate` | Yes | Real `YYYY-MM-DD` date | Date of this record: when the part was installed, measured, or serviced. Not in the original request; it lets readings be followed over time. Not compared with `installed` or `lubricated`. |
| `installed` | `IsoDate` | Yes | Real `YYYY-MM-DD` date | Date the part was installed. Later records of the same installation repeat it. |
| `distance` | `number \| null` | No | 0–500 000, at most 1 decimal | Kilometres ridden on the part since `installed`, as of `date`. `null` when unknown. |
| `position` | `'front' \| 'rear' \| null` | No | Types in §3 only | `null` when unknown or when the entry covers both ends. |
| `subcomponent` | `Subcomponent \| null` | No | Values in §3, per type | `null` when the entry is about the whole component. |
| `lubricated` | `IsoDate \| null` | No | Real `YYYY-MM-DD` date; chain only | Date the chain was waxed or lubricated. May be before `installed`, because chains are often waxed first. |
| `stretch` | `number \| null` | No | 0–5, at most 2 decimals; chain only | Chain wear in percent, as read from a chain checker (`0.5`, `0.75`). |

Dates in the future are not rejected, for the same reason as `Bicycle.purchased` ([README.md §6](./README.md#6-open-questions)).

## 3. Type-specific history fields

Every entry has every key. A field that does not apply to the component's type must be `null`.

| Type | `position` | `subcomponent` | `lubricated`, `stretch` |
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
```

Stored values are codes, not labels. The UI translates them with `t()`.

## 4. Input, normalization, and actions

```ts
interface ComponentInput {
  type: string;   // raw value from a select; '' when nothing is chosen
  model: string;
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
}
type ComponentHistoryUpdate = Partial<ComponentHistoryInput>;
```

Normalization runs before validation:

1. Pick known fields only (`id`, `history`, and any other extra key are dropped).
2. Trim every string.
3. Optional text that is missing, `null`, or blank becomes `null`. A missing number becomes `null`.
4. `-0` becomes `0`, because `-0` does not survive a JSON round trip.

In updates, `null` (or blank text) clears an optional field. An omitted or `undefined` key is unchanged.

| Action | Returns | Behavior |
| --- | --- | --- |
| `addComponent(input)` | `ComponentResult` | Validates, generates an `id`, stores the component with `history: []`, and appends the id to `allIds`. |
| `updateComponent(id, changes)` | `ComponentResult` | Changes `type` and/or `model`. Keeps `id`, `history`, and the place in `allIds`. State is not written when nothing changes. A new `type` is rejected with `{ field: 'type', code: 'notAllowed' }` when any stored entry fails validation for it, whatever that entry's own error code is. |
| `removeComponent(id)` | `boolean` | Removes the component and its history. `false` for an unknown id. The wrapper in `useAppStore.ts` also removes the id from every `Bicycle.components` (see [Links between slices](#links-between-slices)). |
| `addComponentHistoryEntry(componentId, input)` | `ComponentHistoryResult` | Validates against the component's type, generates an entry `id`, and appends the entry. |
| `updateComponentHistoryEntry(componentId, entryId, changes)` | `ComponentHistoryResult` | Merges, normalizes, and validates. Keeps the entry's `id` and place. |
| `removeComponentHistoryEntry(componentId, entryId)` | `boolean` | Removes one entry. `false` for an unknown component or entry. |

A failed action never changes state and does not call `set`. Lookups by component id use an own-property check
(`hasComponent`), as `hasBicycle` does.

### Links between slices

- `addBicycle` and `updateBicycle` reject a component id that is not stored, with
  `{ field: 'components', code: 'notFound' }`. The bicycle slice may read `components`; it never writes it.
- `removeComponent` is wrapped in `useAppStore.ts`. The wrapper returns `false` for an unknown id; otherwise it removes
  the id from the bicycles that list it, then calls the slice action. In this order no subscriber sees a bicycle that
  points at a missing component. The slices still write only their own key.
- `removeBicycle` does not remove components: a rider keeps the parts when a bicycle goes.

## 5. Results and error codes

```ts
type ComponentField = 'id' | 'type' | 'model';
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
| `required` | `type`, `model`, `date`, or `installed` is empty after trimming. |
| `tooLong` | `model` is over 60 characters. |
| `invalidFormat` | `model` has a control character; a date is not a real `YYYY-MM-DD` date; a number is not finite or has too many decimals. |
| `invalidOption` | `type`, `position`, or `subcomponent` is not one of its allowed values. A subcomponent of another type (`rim` on `brakes`) is also `invalidOption`. |
| `outOfRange` | `distance` or `stretch` is negative or above its maximum. |
| `notAllowed` | A history field is set on a type that does not have it (§3), or a type change conflicts with stored history. |
| `tooMany` | The component already has 500 history entries (field `history`). |
| `notFound` | Unknown component (field `id` for component actions, `componentId` for history actions) or unknown entry (field `id`). |

Validation reports every failing field at once, at most one error per field, in field order. For one field,
`notAllowed` is checked first. Numbers are then checked in the order finite, range, decimals.

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
| `distance` is kilometres on the part since `installed`, not the bicycle's odometer reading. | Confirmed by the user. It stays correct when a part moves between bicycles. |
| `wheel` and `tire` have no `position`. | Confirmed by the user, as in the request. |
| `derailleur` is both a component type and a subcomponent of `shifters`. | Confirmed by the user, as in the request. The same part can then be logged in two places. |
| One date, `lubricated`, covers waxing and lubrication. | Confirmed by the user. |
| `stretch` is a percentage, 0–5, as on a chain checker. | Confirmed by the user. |

## 7. Open questions

| Question | Why it matters | Current answer |
| --- | --- | --- |
| Can one component be listed on two bicycles at once? | A part is physically on one bicycle at a time. | Not checked. Does not block any ticket. |
