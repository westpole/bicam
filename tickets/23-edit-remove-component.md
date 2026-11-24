# [FEATURE] Edit and remove a component

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #15)
> **Sprint:** `15-store-component-entity`
> **Estimate:** S

---

## 1. Summary

Add `updateComponent` and `removeComponent`, so a caller can correct a component's type or model and delete it.

---

## 2. Problem / Opportunity

- **Problem statement:** After #22 a component added by mistake cannot be changed or deleted.
- **Evidence:** [components.md §4](../docs/store/components.md#4-input-normalization-and-actions).
- **Success metric(s):** Every stored component can be edited and removed through the store.

---

## 3. User Stories

### Story 1: Edit a component
**As a** rider
**I want to** change a component's type or model
**So that** I can fix a mistake

**Acceptance Criteria:**
- [x] `updateComponent(id, changes)` changes only the given keys and returns `{ ok: true, component }`. `id`,
      `history` (same reference), and the place in `allIds` are kept.
- [x] An omitted or `undefined` key is unchanged; `id` and `history` keys in `changes` are ignored.
- [x] Invalid changes return the same errors as `addComponent` and leave state unchanged.
- [x] Edge case: an unknown id, including `'__proto__'` and `'toString'`, returns
      `{ ok: false, errors: [{ field: 'id', code: 'notFound' }] }`.

**Out of scope:** the type-change rule for stored history (#25, the first type-specific fields).

### Story 2: Remove a component
**As a** rider
**I want to** delete a component
**So that** my list holds only parts I care about

**Acceptance Criteria:**
- [x] `removeComponent(id)` returns `true`, and the id is gone from `byId` and `allIds`. Other components are unchanged.
- [x] An unknown id returns `false` and leaves state unchanged (same object reference).

**Out of scope:** removing the id from bicycles (#28), archiving or undo.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [components.md §4–§5](../docs/store/components.md#4-input-normalization-and-actions) | Action table, error codes |
| Existing pattern | `src/store/bicycle/createBicycleSlice.ts` | `updateBicycle`, `removeBicycle` |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/components/`.
- **Files:** `types.ts` (new `ComponentUpdate`; extend `ComponentActions`), `createComponentsSlice.ts`,
  `utilities/hasComponent.ts`, tests.
- **Shared code:** move `definedChanges` to `src/store/common/utilities/` and make it generic over the update type.
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#22](./22-add-component.md)
- **Blocks:** [#24](./24-record-component-install.md), [#28](./28-link-components-to-bicycles.md)
- **Risks/open questions:** Until #28, removing a component can leave its id in `Bicycle.components`. Nothing reads
  those ids yet.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Store tests passing (`npm run test:store`); 90% branch threshold met
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function and type
- [x] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#22](./22-add-component.md), [#28](./28-link-components-to-bicycles.md)
- Design file: [docs/store/components.md](../docs/store/components.md)
