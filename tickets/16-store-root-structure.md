# [FEATURE] Add domain root keys (`bicycle`, `events`, `components`, `history`) to `useAppStore`

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (#8)
> **Sprint:** `8-store-bicycle-entity`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Extend `useAppStore` with the four domain root keys: `bicycle` (an empty normalized collection, typed) and the
placeholders `events`, `components`, `history`. Later tickets fill in the bicycle logic.

---

## 2. Problem / Opportunity

- **Problem statement:** The store only holds UI state. Domain slices need a fixed place and type so later work
  (bicycle actions, then events/components/history) plugs in without reshaping the store.
- **Evidence:** [docs/store/README.md §1](../docs/store/README.md#1-root-structure).
- **Success metric(s):** `INITIAL_APP_STATE` matches the documented root structure.

---

## 3. User Stories

### Story 1: Root structure
**As a** developer
**I want to** see every planned domain slice as a typed root key of `useAppStore`
**So that** later slices plug in without changing the store's shape

**Acceptance Criteria:**
- [ ] Given a fresh store, then `bicycle` is `{ byId: {}, allIds: [] }` and `events`, `components`, `history` are `{}`.
- [ ] `isMenuOpen` and `activeScreen` keep their names, positions, and initial values.
- [ ] `AppStoreState` types `bicycle` as `BicycleCollection` and the placeholders as `ReservedSlice`
  (`Readonly<Record<string, never>>`).
- [ ] `Bicycle`, `BicycleId`, `ComponentId`, `IsoDate`, and `BicycleCollection` are exported from
  `src/store/bicycle/types.ts` as in [docs/store/bicycle.md §1](../docs/store/bicycle.md#1-shape).
- [ ] Given bicycle data was changed, when `reset()` runs, then the whole state equals `INITIAL_APP_STATE`.

**Out of scope:** Bicycle actions, validation, persistence, any UI.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Store design | [docs/store/README.md](../docs/store/README.md) | Root structure, file layout |
| Bicycle shape | [docs/store/bicycle.md §1](../docs/store/bicycle.md#1-shape) | Types |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand store, `src/store/`.
- **Files:** `src/store/types.ts` (add keys, `ReservedSlice`), `src/store/constants.ts`,
  `src/store/bicycle/types.ts`, `src/store/bicycle/constants.ts` (`INITIAL_BICYCLE_COLLECTION`),
  `src/store/__tests__/useAppStore.test.ts`.
- `src/store/bicycle/types.ts` must not import from `src/store/types.ts` (no cycle).
- **Test lane:** `npm run test:store`, then `npm run test:all` (App tests and stories spread `INITIAL_APP_STATE`).

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** #17, #18
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (`npm run test:store`)
- [ ] JSDoc on every exported type and constant

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#17](./17-bicycle-validation.md), [#18](./18-bicycle-actions.md)
- Design file: [docs/store/README.md](../docs/store/README.md)
