# App store

> **Status:** Implemented (batch #8)
> **Owner layer:** Zustand, `src/store/`

Bicam keeps all shared state in one Zustand store, `useAppStore` (`src/store/useAppStore.ts`). This folder documents
the shape of that store, the data limits of each entity, and the rules every slice follows.

| Document | Covers |
| --- | --- |
| [README.md](./README.md) | Root structure, conventions, persistence, open questions |
| [bicycle.md](./bicycle.md) | The `bicycle` slice and the `Bicycle` entity |
| [components.md](./components.md) | The `components` slice and the `BicycleComponent` entity |

## 1. Root structure

```ts
interface AppStoreState {
  // UI state (not domain data)
  isMenuOpen: boolean;          // app menu visibility
  activeScreen: ScreenView;     // screen shown in <main>
  selectedBicycleId: BicycleId | null; // bicycle on the bicycleDetails screen

  // Domain data
  bicycle: BicycleCollection;   // implemented, see bicycle.md
  events: ReservedSlice;        // placeholder, always {}
  components: ComponentCollection; // implemented, see components.md
  history: ReservedSlice;       // placeholder, always {}
}
```

| Key | Status | Type | Initial value | Notes |
| --- | --- | --- | --- | --- |
| `isMenuOpen` | Implemented | `boolean` | `false` | UI only. |
| `activeScreen` | Implemented | `ScreenView` | `'home'` | UI only. `'home' \| 'addBicycle' \| 'addComponent' \| 'addClothesSet' \| 'beforeRideCheckIn' \| 'bicycleDetails'`. `navigateTo` accepts every screen except `'bicycleDetails'`, which only `openBicycleDetails(id)` opens. |
| `selectedBicycleId` | Implemented | `BicycleId \| null` | `null` | UI only. After each action completes, `activeScreen === 'bicycleDetails'` exactly when this is a stored bicycle id. Set by `openBicycleDetails`; cleared by `navigateTo` and by removing the selected bicycle. |
| `bicycle` | Implemented | `BicycleCollection` | `{ byId: {}, allIds: [] }` | The user's bicycles. See [bicycle.md](./bicycle.md). |
| `events` | Placeholder | `ReservedSlice` | `{}` | Reserved for maintenance and ride events. |
| `components` | Implemented | `ComponentCollection` | `{ byId: {}, allIds: [] }` | The user's components. `Bicycle.components` references ids from here. See [components.md](./components.md). |
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
- **`reset()`** restores `INITIAL_APP_STATE`, including all domain data. It also overwrites the saved data (§4) with
  empty collections, without a backup, so any UI for it must ask first. If that write fails, the old data stays saved.
- **Reading** follows the existing rule: only `src/App.tsx` reads the store, using atomic selectors. A selector that
  builds a new array or object on each call (for example mapping `allIds` to entities) must be wrapped with
  `useShallow` or memoized, or React will re-render forever.

## 3. File layout

```text
src/store/
├── useAppStore.ts          # create() + UI actions, composes slices, wraps slice actions with navigation effects
├── types.ts                # AppStoreState, AppStoreActions, ReservedSlice, ScreenView, MenuScreen
├── constants.ts            # INITIAL_APP_STATE
├── __tests__/
├── persistence/            # saving to localStorage, see §4
│   ├── types.ts            # PersistedAppState, AppStorage
│   ├── constants.ts        # APP_STORAGE_KEY, APP_STORAGE_VERSION
│   ├── createPersistOptions.ts # options for the Zustand persist middleware
│   ├── utilities/          # storage adapter, migrate, merge, shape checks; one function per file
│   ├── __mocks__/
│   └── __tests__/
├── common/                 # helpers shared by the slices, no state
│   ├── types.ts            # IsoDate, TextErrorCode
│   ├── constants.ts        # CONTROL_CHARACTER_PATTERN, ISO_DATE_PATTERN
│   ├── utilities/          # one function per file
│   └── __tests__/
├── bicycle/
│   ├── types.ts            # Bicycle, BicycleInput, BicycleDetails, BicycleCollection, results, errors
│   ├── constants.ts        # BICYCLE_LIMITS, INITIAL_BICYCLE_COLLECTION
│   ├── createBicycleSlice.ts
│   ├── utilities/          # one function per file
│   └── __tests__/
└── components/
    ├── types.ts            # BicycleComponent, ComponentHistoryEntry, inputs, ComponentCollection, results, errors
    ├── constants.ts        # COMPONENT_LIMITS, COMPONENT_TYPES, per-type history rules, ACTIVE_LIMITS, default limits
    ├── createComponentsSlice.ts
    ├── utilities/          # one function per file
    └── __tests__/
```

Each future slice (`events`, `history`) gets its own folder with the same layout.

## 4. Persistence

The store is saved to `localStorage` with Zustand `persist` (`src/store/persistence/`), in the web build and in the
Electron `file://` build alike. It loads synchronously while the store is created, so the first render has the data.

- **Saved:** `bicycle` and `components`, under the key `bicam-app-store`, with a `version`. UI state (`isMenuOpen`,
  `activeScreen`, `selectedBicycleId`) is not saved, so the app always starts on `home`. `events` and `history` are not
  saved while they are placeholders; add them to `PersistedAppState`, `partialize`, `isPersistedAppState`,
  `mergePersistedState`, and the unchanged check in `createAppStorage` when they hold data.
- **Changing an entity shape** needs a higher `APP_STORAGE_VERSION`, a migration in `migratePersistedState`, and updated
  checks in `persistence/utilities/`. Without the migration, existing users start with an empty app. Keep the checks of
  the old version as they are (`*V1` files and the `*V1` types in `persistence/types.ts`), so a later change to today's
  types cannot change what the migration accepts.
- **The current version is 2.** Version 1 data is checked with `isPersistedAppStateV1` and upgraded by
  `migrateFromVersion1`, keeping every bicycle, component, and history entry and their order:
  - Bicycles get `odometer: 0` and `odometerDate: null`.
  - Components get `label: null`, `retired: null`, and the default limits of their type (`DEFAULT_COMPONENT_LIMITS`).
    `initialDistance` is the distance of the newest whole-component history entry that has one (latest `date`, then the
    last one added); subcomponent entries are ignored; without such an entry it is 0.
  - Assigned components start in use at odometer 0 with date `null`, unless their bicycle has more components of their
    type than `ACTIVE_LIMITS` allows; then none of that type starts in use, because a wrong guess would credit the wrong
    part. Spare components get `usage: []`. A component counts once per bicycle; one listed by two bicycles starts on, and counts for, the first one only.
  - History entries get `lubricant: null` and `cleaned: null`.
  - Version 1 data with a broken shape fails like any unreadable data (see below).
- **Loaded data is untrusted.** `isPersistedAppState` checks types, date formats, option codes, and references: a bicycle
  lists stored components only, and a component has at most one open usage period, on a stored bicycle that lists it
  ([components.md §2.3](./components.md#23-usage-and-limits)). It does not check field limits, `ACTIVE_LIMITS`, period
  counts, overlapping periods, or chain-only limits, so tightening a rule never makes saved data unreadable. It does not
  look up `replacedPeriodId`, the bicycle of a closed period, or the bicycle in `retired`, because they may name
  something that was removed.
- **Data that cannot be loaded** (corrupt, wrong shape, or a version without a migration, such as after a downgrade) is
  copied to `bicam-app-store:backup:<timestamp>`, and the app starts empty. The same text is backed up only once. If the
  copy fails, nothing is saved until the app reloads, so the original stays intact. Backups are never deleted, and
  restoring one is a manual step for now.
- **A failed save** (storage full or blocked) is logged and never breaks an action. Changes stay in memory, and the next
  data change tries again. The user is not told yet.
- **UI-only updates do not write.** `persist` writes on every update, so the adapter compares the slices by reference
  with the ones it last read or tried to write, and skips unchanged ones. The one exception is the first update
  after a start without saved data, or with saved data that could not be loaded (and is backed up by then): it saves the
  empty collections.

Known limits:

- `localStorage` holds about 5 million characters, roughly 28,000 history entries. Move to a file in Electron `userData`
  (through a preload/IPC bridge) only if storage size or backups require it.
- A backup is a full copy and counts against the same quota. Unreadable data that is too large to copy blocks saving on
  every start until the storage is cleared by hand, and a copy that nearly fills the quota can make later saves fail.
- Chromium (and so Electron) writes `localStorage` to disk with a short delay. A crash, a killed process, or a power loss
  can drop the last few seconds of changes, with no error logged.
- On the web, the data goes away with the site data, and Safari may remove it after 7 days without a visit.
- Two open tabs do not sync: the last one to save wins. Electron allows only one instance.
- The data belongs to the origin. `npm run dev:electron` (`http://localhost`) does not share data with the packaged app,
  and replacing `file://` with a custom protocol would need a one-time migration.

## 5. Decisions

| Decision | Reason |
| --- | --- |
| Bicycles are keyed by a generated UUID `id`; the user-typed title is a separate, unique `name`. | Other slices will reference bicycles by key. A user-typed key would break those references (and old history entries) on rename. With a generated id, renaming is a plain field update. |
| Navigation and cross-slice side effects of domain actions live in `useAppStore.ts` wrappers, not in slices (e.g. removing the selected bicycle returns to `home`; taking a component off a bicycle or removing the bicycle closes its usage period; removing a component unlinks it from its bicycles; `addComponentToBicycle` stores a component, links it, and can start it; `assignComponent` links a stored one and can start it). | Each slice owns only its domain key; the UI fields belong to the root store. A wrapper builds the next collections with pure helpers that the slice actions share, then writes every changed key, UI fields included, in one `set` ([components.md §4](./components.md#links-between-slices)). `persist` saves after every `set`, so a second one could save a state that breaks rule 1 and cannot be loaded; with one, subscribers are notified once and never see an in-between state. |

## 6. Open questions

| Question | Why it matters | Current answer |
| --- | --- | --- |
| Should `frameGeometry` be structured? | Free text cannot be compared or validated (stack, reach, head tube angle, …). | Free text for now. A structured, unit-tagged object (mm, degrees) can replace it with a migration. |
| Should `purchased` reject future dates? | Needs the current date, which makes the store depend on a clock. | Not checked in the store. The input form can warn. |
