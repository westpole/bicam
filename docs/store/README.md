# App store

> **Status:** Implemented (batch #8)
> **Owner layer:** Zustand, `src/store/`

Bicam keeps all shared state in one Zustand store, `useAppStore` (`src/store/useAppStore.ts`). This folder documents
the shape of that store, the data limits of each entity, and the rules every slice follows.

| Document | Covers |
| --- | --- |
| [README.md](./README.md) | Root structure, conventions, persistence notes, open questions |
| [bicycle.md](./bicycle.md) | The `bicycle` slice and the `Bicycle` entity |

## 1. Root structure

```ts
interface AppStoreState {
  // UI state (not domain data)
  isMenuOpen: boolean;          // app menu visibility
  activeScreen: ScreenView;     // screen shown in <main>

  // Domain data
  bicycle: BicycleCollection;   // implemented, see bicycle.md
  events: ReservedSlice;        // placeholder, always {}
  components: ReservedSlice;    // placeholder, always {}
  history: ReservedSlice;       // placeholder, always {}
}
```

| Key | Status | Type | Initial value | Notes |
| --- | --- | --- | --- | --- |
| `isMenuOpen` | Implemented | `boolean` | `false` | UI only. |
| `activeScreen` | Implemented | `ScreenView` | `'home'` | UI only. |
| `bicycle` | Implemented | `BicycleCollection` | `{ byId: {}, allIds: [] }` | The user's bicycles. See [bicycle.md](./bicycle.md). |
| `events` | Placeholder | `ReservedSlice` | `{}` | Reserved for maintenance and ride events. |
| `components` | Placeholder | `ReservedSlice` | `{}` | Reserved for components. `Bicycle.components` will reference ids from here. |
| `history` | Placeholder | `ReservedSlice` | `{}` | Reserved for the change and maintenance log. |

`ReservedSlice` is `Readonly<Record<string, never>>`: an empty object that holds nothing. The real types replace it
when each slice is implemented. Until then nothing may write to these keys.

The UI fields stay at the root, where they were before this batch, so existing consumers (`App.tsx`, stories, tests)
work unchanged.

## 2. Conventions

These rules apply to every domain slice, now and in the future.

- **Plain JSON only.** Slice data must survive `JSON.parse(JSON.stringify(state))` unchanged: no `Date`, `Map`, `Set`,
  class instances, `undefined` values, or functions. This keeps persistence and export simple.
- **Dates** are ISO 8601 calendar dates, `YYYY-MM-DD`, with no time or time zone (`'2024-05-17'`).
- **Unknown values** are `null`, not `undefined` and not an empty string.
- **Text** is trimmed before it is stored. Limits count UTF-16 code units (`string.length`).
- **Entity collections** are normalized: `{ byId: Record<Id, Entity>; allIds: Id[] }`. `allIds` holds the display
  order (insertion order). A plain object cannot hold the order, because JavaScript sorts integer-like keys such as
  `'51'` or `'2024'` ahead of other keys.
- **Ids are generated, names are typed.** Every entity key is a UUID v4 from `crypto.randomUUID()`, assigned by the
  store on creation and never changed, so references from other slices stay valid. Anything the user types and sees
  as a title (for example `Bicycle.name`) is a separate, editable field. `crypto.randomUUID()` needs a secure
  context: `https://`, `localhost`, or Electron's `file://` all qualify.
- **Writes go through store actions.** Actions validate and normalize input and return a result object; they never
  throw for invalid user input. Errors are codes (`'required'`, `'tooLong'`, …), not text, so the UI translates them
  with `t()`.
- **Immutability.** Actions replace changed objects and arrays and never mutate them in place, so Zustand selectors
  see new references.
- **`reset()`** restores `INITIAL_APP_STATE`, including all domain data.
- **Reading** follows the existing rule: only `src/App.tsx` reads the store, using atomic selectors. A selector that
  builds a new array or object on each call (for example mapping `allIds` to entities) must be wrapped with
  `useShallow` or memoized, or React will re-render forever.

## 3. File layout

```text
src/store/
├── useAppStore.ts          # create() + UI actions, composes slices
├── types.ts                # AppStoreState, AppStoreActions, ReservedSlice, ScreenView
├── constants.ts            # INITIAL_APP_STATE
├── __tests__/
└── bicycle/
    ├── types.ts            # Bicycle, BicycleInput, BicycleDetails, BicycleCollection, results, errors
    ├── constants.ts        # BICYCLE_LIMITS, INITIAL_BICYCLE_COLLECTION
    ├── createBicycleSlice.ts
    ├── utilities/          # one function per file
    └── __tests__/
```

Each future slice (`events`, `components`, `history`) gets its own folder with the same layout.

## 4. Persistence

The store is **not persisted** yet: data is lost when the app reloads. This is intentional for this batch. When
persistence is added:

- Use Zustand `persist` with `partialize`, so only domain keys are stored and `isMenuOpen` / `activeScreen` are not.
- Set a `version` and a `migrate` function from day one. Any change to an entity shape after that needs a migration.
- `localStorage` works for both the web build and the Electron `file://` build. Move to a file in Electron
  `userData` (through a preload/IPC bridge) only if storage size or backups require it.

## 5. Decisions

| Decision | Reason |
| --- | --- |
| Bicycles are keyed by a generated UUID `id`; the user-typed title is a separate, unique `name`. | Other slices will reference bicycles by key. A user-typed key would break those references (and old history entries) on rename. With a generated id, renaming is a plain field update. |

## 6. Open questions

| Question | Why it matters | Current answer |
| --- | --- | --- |
| Should `frameGeometry` be structured? | Free text cannot be compared or validated (stack, reach, head tube angle, …). | Free text for now. A structured, unit-tagged object (mm, degrees) can replace it with a migration. |
| Should `purchased` reject future dates? | Needs the current date, which makes the store depend on a clock. | Not checked in the store. The input form can warn. |
| Should `components` be checked against the `components` slice? | Ids could point to components that do not exist. | Not possible yet (placeholder slice). Add the check when the `components` slice is implemented. |
