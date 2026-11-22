# [FEATURE] Add `addBicycle`, `updateBicycle`, `removeBicycle` store actions

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

Add a bicycle slice to `useAppStore` with actions that add, update, and remove bicycles, using the validators from
#17, so the future **Add bicycle** screen has one validated way to write bicycle data.

---

## 2. Problem / Opportunity

- **Problem statement:** The `bicycle` collection exists (#16) but nothing can write to it safely.
- **Evidence:** [docs/store/bicycle.md §4](../docs/store/bicycle.md#4-actions).
- **Success metric(s):** All bicycle writes go through these actions; a failed action never changes state.

---

## 3. User Stories

### Story 1: Add a bicycle
**As a** developer
**I want to** add a bicycle from form input
**So that** it is stored normalized and validated

**Acceptance Criteria:**
- [ ] Given valid input, when `addBicycle(input)` runs, then it returns `{ ok: true, bicycle }` with the normalized
  bicycle, `byId[id]` holds it, and `id` is appended to `allIds`.
- [ ] Given an id already used in any letter case, then it returns `{ ok: false, errors: [{ field: 'id', code: 'duplicate' }, …] }`.
- [ ] Given invalid input, then it returns all validation errors and state is unchanged (same object reference).
- [ ] Edge case: integer-like ids (`'51'`, `'2024'`) keep insertion order in `allIds`.

**Out of scope:** Checking component ids against the `components` slice, UI.

### Story 2: Update a bicycle
**As a** developer
**I want to** change some fields of a stored bicycle
**So that** the user can correct or complete its details

**Acceptance Criteria:**
- [ ] Given a stored bicycle, when `updateBicycle(id, changes)` runs with valid changes, then only the given keys
  change, the result is normalized and validated, and the id keeps its place in `allIds`.
- [ ] Passing `null` for an optional field clears it; omitting a key leaves it unchanged.
- [ ] Given an unknown id, then it returns `{ ok: false, errors: [{ field: 'id', code: 'notFound' }] }`.
- [ ] Given invalid changes, then it returns the errors and state is unchanged.

**Out of scope:** Renaming a bicycle (changing its `id`).

### Story 3: Remove a bicycle
**As a** developer
**I want to** remove a bicycle by id
**So that** the user can delete bicycles they no longer own

**Acceptance Criteria:**
- [ ] Given a stored bicycle, when `removeBicycle(id)` runs, then it returns `true` and the id is gone from `byId` and `allIds`.
- [ ] Given an unknown id, then it returns `false` and state is unchanged.
- [ ] Ids are matched exactly: `removeBicycle('roadie')` does not remove `'Roadie'`.

**Out of scope:** Cascading removal into `events`/`components`/`history` (placeholders).

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Actions | [docs/store/bicycle.md §4](../docs/store/bicycle.md#4-actions) | Behavior table |
| Results | [docs/store/bicycle.md §5](../docs/store/bicycle.md#5-results-and-error-codes) | Result type, codes |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand store, `src/store/`.
- **Files:** `src/store/bicycle/types.ts` (`BicycleActions`), `src/store/bicycle/createBicycleSlice.ts`
  (`StateCreator<AppStore, [], [], BicycleActions>`), `src/store/types.ts` (`AppStoreActions` extends
  `BicycleActions`), `src/store/useAppStore.ts` (spread the slice), tests in `src/store/bicycle/__tests__/`.
- Immutable updates: new `bicycle`, `byId`, and `allIds` objects on change; no `set()` call on failure.
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** #16, #17
- **Blocks:** —
- **Risks/open questions:** Using the user-defined id as the key makes renaming hard later; see
  [docs/store/README.md §5](../docs/store/README.md#5-open-questions). Accepted for this batch.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (`npm run test:store`)
- [ ] JSDoc on every function and type
- [ ] Store docs updated if behavior differs from the plan

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#16](./16-store-root-structure.md), [#17](./17-bicycle-validation.md)
- Design file: [docs/store/bicycle.md](../docs/store/bicycle.md)
