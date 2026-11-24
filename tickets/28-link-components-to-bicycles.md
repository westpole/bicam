# [FEATURE] Keep bicycle component ids valid

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P2
> **Epic:** [plan.md](./plan.md) (batch #15)
> **Sprint:** `15-store-component-entity`
> **Estimate:** S

---

## 1. Summary

Make `Bicycle.components` hold only ids of stored components: reject unknown ids when a bicycle is written, and unlink
a component from its bicycles when it is removed.

---

## 2. Problem / Opportunity

- **Problem statement:** A bicycle can list components that do not exist, so a future screen could show missing parts.
- **Evidence:** [store README §6](../docs/store/README.md#6-open-questions) defers this check until the `components`
  slice exists.
- **Success metric(s):** After any action, every id in every `Bicycle.components` is a key of `components.byId`.

---

## 3. User Stories

### Story 1: Reject unknown components
**As a** developer
**I want to** have unknown component ids rejected
**So that** a bicycle never points at a missing part

**Acceptance Criteria:**
- [x] `addBicycle` and `updateBicycle` with an unknown id, including `'toString'`, return
      `{ field: 'components', code: 'notFound' }` and leave state unchanged.
- [x] The existing `components` checks come first: `tooMany`, `required`, `tooLong`, `invalidFormat`, and `duplicate`
      win over `notFound`. Still one error per field, in field order.
- [x] Stored ids and an empty list are accepted.

**Out of scope:** stopping two bicycles from listing the same component.

### Story 2: Unlink a removed component
**As a** rider
**I want to** have a deleted part leave my bicycles
**So that** they list only parts that exist

**Acceptance Criteria:**
- [x] `removeComponent(id)` also removes the id from every bicycle that lists it. Bicycles that do not list it keep
      their references; if none lists it, `bicycle` keeps its reference.
- [x] Removing an unknown component returns `false` and changes nothing.
- [x] `removeBicycle` leaves `components` unchanged.

**Out of scope:** a confirmation before removal.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [components.md §4](../docs/store/components.md#links-between-slices) | Links between slices |
| Existing pattern | `src/store/useAppStore.ts` | `removeBicycle` wrapper |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/**`.
- **Files:** `src/store/bicycle/utilities/validateBicycleInCollection.ts` (takes the component collection),
  `src/store/bicycle/createBicycleSlice.ts` (passes `get().components`), `src/store/useAppStore.ts` (`removeComponent`
  wrapper), and a pure `src/store/bicycle/utilities/unlinkComponent.ts` that returns the new bicycle collection.
- `createBicycleSlice.ts` reads `components` and never writes it.
- **Wrapper order:** return `false` when `hasComponent` is false; otherwise unlink from the bicycles, then call the slice
  action. A subscriber then never sees a bicycle that points at a missing component.
- **Existing tests:** `createBicycleSlice.test.ts` uses made-up ids (`'chain-1'`, `'chain-2'`, `'cassette-1'`). Seed
  those components in `beforeEach`; do not weaken the assertions.
- **Docs:** [bicycle.md](../docs/store/bicycle.md) §2 and §5, [store README](../docs/store/README.md) §5 (wrappers also
  hold cross-slice effects) and §6 (remove the answered question).
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#23](./23-edit-remove-component.md)
- **Blocks:** —
- **Risks/open questions:** None. E2E specs seed the store directly and bypass this check; the bicycle fixtures in
  `src/ui/components/screens/Home/__mocks__/bicycles.ts` use `components: []`.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Store tests passing (`npm run test:store`); 90% branch threshold met
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function; store docs updated
- [x] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#22](./22-add-component.md), [#23](./23-edit-remove-component.md)
- Design file: [docs/store/components.md](../docs/store/components.md)
