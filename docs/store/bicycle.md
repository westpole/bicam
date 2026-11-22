# Bicycle slice

> **Status:** Implemented (batch #8)
> **Owner layer:** Zustand, `src/store/bicycle/`
> **Root key:** `bicycle` (see [README.md](./README.md))

The `bicycle` slice holds the user's bicycles. Each bicycle has a user-defined `id` that is also shown as its title.

## 1. Shape

```ts
type BicycleId = string;
type ComponentId = string;
type IsoDate = string; // 'YYYY-MM-DD'

interface Bicycle {
  id: BicycleId;
  company: string;
  model: string;
  purchased: IsoDate | null;
  size: string | null;
  frameGeometry: string | null;
  components: ComponentId[];
}

interface BicycleCollection {
  byId: Record<BicycleId, Bicycle>;
  allIds: BicycleId[]; // display order = insertion order
}
```

Example:

```json
{
  "byId": {
    "Gravel Grinder": {
      "id": "Gravel Grinder",
      "company": "Canyon",
      "model": "Grizl CF SL 7",
      "purchased": "2024-05-17",
      "size": "M",
      "frameGeometry": "Stack 594 mm, reach 393 mm, HTA 71°",
      "components": []
    }
  },
  "allIds": ["Gravel Grinder"]
}
```

## 2. Fields and limits

All text is trimmed before it is validated and stored. Lengths are counted after trimming.

| Field | Type | Required | Limits | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | 1–40 chars; no control characters; unique, case-insensitive (`'Roadie'` and `'roadie'` clash) | Chosen by the user and shown as the bicycle's title. Cannot be changed after creation (see [open questions](./README.md#5-open-questions)). |
| `company` | `string` | Yes | 1–60 chars; no control characters | Manufacturer or brand, e.g. `'Canyon'`. |
| `model` | `string` | Yes | 1–60 chars; no control characters | e.g. `'Grizl CF SL 7'`. |
| `purchased` | `IsoDate \| null` | No | `YYYY-MM-DD`, must be a real calendar date (`2023-02-30` is rejected) | Date of purchase. `null` when unknown. |
| `size` | `string \| null` | No | 1–10 chars from `A–Z a–z 0–9`, space, `.`, `/`, `-` | Holds letter sizes (`'ML'`, `'M/L'`, `'XS'`) and numeric sizes (`'51'`, `'56.5'`). Stored as typed: no case change, no unit. `null` when unknown. |
| `frameGeometry` | `string \| null` | No | 1–500 chars; line breaks allowed, other control characters rejected | Free-text notes (stack, reach, angles, …). `null` when unknown. |
| `components` | `ComponentId[]` | No (defaults to `[]`) | Up to 100 ids; each 1–64 chars, trimmed, no control characters; no duplicates | Ids of the components installed on this bicycle now. Not checked against the `components` slice yet (placeholder). |

Limits live in `BICYCLE_LIMITS` (`src/store/bicycle/constants.ts`).

## 3. Input and normalization

Actions take a `BicycleInput`, which is more forgiving than `Bicycle`:

```ts
interface BicycleInput {
  id: string;
  company: string;
  model: string;
  purchased?: string | null;
  size?: string | null;
  frameGeometry?: string | null;
  components?: string[];
}
```

Normalization (`normalizeBicycleInput`) runs before validation:

1. Trim every string, including each component id.
2. Optional text that is missing, `null`, or empty after trimming becomes `null`.
3. A missing `components` list becomes `[]`.

## 4. Actions

| Action | Returns | Behavior |
| --- | --- | --- |
| `addBicycle(input: BicycleInput)` | `BicycleResult` | Normalizes and validates `input`. On success, stores the bicycle and appends its id to `allIds`. Fails with `{ field: 'id', code: 'duplicate' }` when the id is already used (case-insensitive). |
| `updateBicycle(id: BicycleId, changes: BicycleUpdate)` | `BicycleResult` | `BicycleUpdate` is `Partial<Omit<BicycleInput, 'id'>>`. Merges `changes` into the stored bicycle, then normalizes and validates the result. Position in `allIds` is kept. Fails with `{ field: 'id', code: 'notFound' }` for an unknown id. Passing `null` (or blank text) clears an optional field; omitting a key, or passing `undefined`, leaves it unchanged. An `id` key in `changes` is ignored. |
| `removeBicycle(id: BicycleId)` | `boolean` | Removes the bicycle from `byId` and `allIds`. Returns `false` (and leaves state unchanged) for an unknown id. |

Ids are matched exactly (case-sensitive) in `updateBicycle` and `removeBicycle`. Only the duplicate check is
case-insensitive. A failed action never changes state.

Lookups use own-property checks (`hasBicycle`), so ids that match `Object.prototype` names (`'toString'`,
`'constructor'`, `'__proto__'`) are stored and found like any other id and never match inherited properties.

## 5. Results and error codes

```ts
type BicycleField = keyof Bicycle;
type BicycleErrorCode = 'required' | 'tooLong' | 'invalidFormat' | 'tooMany' | 'duplicate' | 'notFound';

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
| `required` | `id`, `company`, or `model` is empty after trimming, or a component id is empty. |
| `tooLong` | A text value or a component id is longer than its limit. |
| `invalidFormat` | A value contains a character that is not allowed, `size` has a character outside its set, or `purchased` is not a real `YYYY-MM-DD` date. |
| `tooMany` | `components` has more than 100 ids. |
| `duplicate` | `id` is already used (case-insensitive), or `components` lists an id twice. |
| `notFound` | `updateBicycle` was called with an unknown id. |

Validation reports every failing field at once (one error per field, in field order), so a form can mark all of them.
