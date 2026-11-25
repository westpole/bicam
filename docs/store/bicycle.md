# Bicycle slice

> **Status:** Implemented (batch #8)
> **Owner layer:** Zustand, `src/store/bicycle/`
> **Root key:** `bicycle` (see [README.md](./README.md))

The `bicycle` slice holds the user's bicycles. Each bicycle has a generated `id` that never changes and is used as
its key, and a user-typed `name` that is shown as its title and can be renamed.

## 1. Shape

```ts
type BicycleId = string;   // UUID v4, generated
type ComponentId = string;
type IsoDate = string;     // 'YYYY-MM-DD'

interface Bicycle {
  id: BicycleId;
  name: string;
  company: string;
  model: string;
  purchased: IsoDate | null;
  size: string | null;
  frameGeometry: string | null;
  components: ComponentId[];
  odometer: number;            // km, as the rider entered it; starts at 0
  odometerDate: IsoDate | null; // date of that reading; null when unknown
}

// the fields the bicycle form edits; the odometer has its own action
type BicycleDetails = Omit<Bicycle, 'id' | 'odometer' | 'odometerDate'>;

interface BicycleCollection {
  byId: Record<BicycleId, Bicycle>;
  allIds: BicycleId[]; // display order = insertion order
}
```

Example:

```json
{
  "byId": {
    "3b241101-e2bb-4255-8caf-4136c566a962": {
      "id": "3b241101-e2bb-4255-8caf-4136c566a962",
      "name": "Gravel Grinder",
      "company": "Canyon",
      "model": "Grizl CF SL 7",
      "purchased": "2024-05-17",
      "size": "M",
      "frameGeometry": "Stack 594 mm, reach 393 mm, HTA 71°",
      "components": [],
      "odometer": 1500,
      "odometerDate": "2026-04-12"
    }
  },
  "allIds": ["3b241101-e2bb-4255-8caf-4136c566a962"]
}
```

## 2. Fields and limits

All text is trimmed before it is validated and stored. Lengths are counted after trimming.

| Field | Type | Required | Limits | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Generated | UUID v4 from `crypto.randomUUID()` | Assigned by `addBicycle`; never changes and cannot be set by the caller. Other slices (`events`, `history`) will reference bicycles by this id. |
| `name` | `string` | Yes | 1–40 chars; no control characters; unique, case-insensitive (`'Roadie'` and `'roadie'` clash) | Typed by the user and shown as the bicycle's title. Can be changed with `updateBicycle`. |
| `company` | `string` | Yes | 1–60 chars; no control characters | Manufacturer or brand, e.g. `'Canyon'`. |
| `model` | `string` | Yes | 1–60 chars; no control characters | e.g. `'Grizl CF SL 7'`. |
| `purchased` | `IsoDate \| null` | No | `YYYY-MM-DD`, must be a real calendar date (`2023-02-30` is rejected) | Date of purchase. `null` when unknown. |
| `size` | `string \| null` | No | 1–10 chars from `A–Z a–z 0–9`, space, `.`, `/`, `-` | Holds letter sizes (`'ML'`, `'M/L'`, `'XS'`) and numeric sizes (`'51'`, `'56.5'`). Stored as typed: no case change, no unit. `null` when unknown. |
| `frameGeometry` | `string \| null` | No | 1–500 chars; line breaks allowed, other control characters rejected | Free-text notes (stack, reach, angles, …). `null` when unknown. |
| `components` | `ComponentId[]` | No (defaults to `[]`) | Up to 100 ids; each 1–64 chars, trimmed, no control characters; no duplicates | Ids of the components installed on this bicycle now. Every id must be a stored component that is on no other bicycle; removing a component also removes its id here (see [components.md §4](./components.md#links-between-slices)). |
| `odometer` | `number` | Starts at 0 | — | Total kilometres, entered by the rider. The source of every component's distance ([components.md §2.3](./components.md#23-usage-and-limits)). No action writes it yet; `addBicycle` and `updateBicycle` never change it. |
| `odometerDate` | `IsoDate \| null` | Starts as `null` | — | Date of the `odometer` reading. `null` when unknown. No action writes it yet. |

Limits live in `BICYCLE_LIMITS` (`src/store/bicycle/constants.ts`).

## 3. Input and normalization

Actions take a `BicycleInput`, which is more forgiving than `Bicycle` and has no `id`:

```ts
interface BicycleInput {
  name: string;
  company: string;
  model: string;
  purchased?: string | null;
  size?: string | null;
  frameGeometry?: string | null;
  components?: string[];
}
```

Normalization (`normalizeBicycleInput`) runs before validation and returns `BicycleDetails`:

1. Pick known fields only (an `id`, the odometer fields, or any other extra key is dropped).
2. Trim every string, including each component id.
3. Optional text that is missing, `null`, or empty after trimming becomes `null`.
4. A missing `components` list becomes `[]`.

## 4. Actions

| Action | Returns | Behavior |
| --- | --- | --- |
| `addBicycle(input: BicycleInput)` | `BicycleResult` | Normalizes and validates `input`, then generates an `id`, stores the bicycle with `odometer: 0` and `odometerDate: null`, and appends the id to `allIds`. Fails with `{ field: 'name', code: 'duplicate' }` when another bicycle has the same name (case-insensitive), and on `components` with `notFound` or `alreadyInstalled` (see §5). No id is generated on failure. |
| `updateBicycle(id: BicycleId, changes: BicycleUpdate)` | `BicycleResult` | `BicycleUpdate` is `Partial<BicycleInput>`. Merges `changes` into the stored bicycle, then normalizes and validates the result. Renaming is allowed: the new name must not match another bicycle's name (changing the case of its own name is fine). The `id` and position in `allIds` are kept. Fails with `{ field: 'id', code: 'notFound' }` for an unknown id, and on `components` with `notFound` or `alreadyInstalled` (see §5); the bicycle's own components never count as installed elsewhere. Passing `null` (or blank text) clears an optional field; omitting a key, or passing `undefined`, leaves it unchanged. The odometer fields are always kept; `id`, `odometer`, and `odometerDate` keys in `changes` are ignored. |
| `removeBicycle(id: BicycleId)` | `boolean` | Removes the bicycle from `byId` and `allIds`. Returns `false` (and leaves state unchanged) for an unknown id. When the removed bicycle is the one on the details screen (`selectedBicycleId`), the store's wrapper in `useAppStore.ts` also sets `selectedBicycleId: null` and `activeScreen: 'home'` (see [README.md](./README.md) §5). |

Ids are matched exactly. Name clashes are checked case-insensitively. A failed action never changes state.

Lookups use own-property checks (`hasBicycle`), so a caller-supplied id that matches an `Object.prototype` name
(`'toString'`, `'__proto__'`) is reported as not found instead of matching an inherited property.

## 5. Results and error codes

```ts
type BicycleField = keyof Bicycle;
type BicycleErrorCode =
  | 'required' | 'tooLong' | 'invalidFormat' | 'tooMany' | 'duplicate' | 'notFound' | 'alreadyInstalled';

interface BicycleValidationError {
  field: BicycleField;
  code: BicycleErrorCode;
}

type BicycleResult =
  | { ok: true; bicycle: Bicycle }
  | { ok: false; errors: BicycleValidationError[] };
```

| Code | Raised when |
| --- | --- |
| `required` | `name`, `company`, or `model` is empty after trimming, or a component id is empty. |
| `tooLong` | A text value or a component id is longer than its limit. |
| `invalidFormat` | A value contains a character that is not allowed, `size` has a character outside its set, or `purchased` is not a real `YYYY-MM-DD` date. |
| `tooMany` | `components` has more than 100 ids. |
| `duplicate` | `name` is already used by another bicycle (case-insensitive), or `components` lists an id twice. |
| `notFound` | `updateBicycle` was called with an unknown `id` (returned alone), or `components` lists an id that is not a stored component (checked after the other `components` rules). |
| `alreadyInstalled` | `components` lists a component that is on another bicycle (checked after `notFound`). |

Validation reports every failing field at once (one error per field, in field order), so a form can mark all of them.
On success, the returned `bicycle` is the object held in the store; treat it as read-only.
