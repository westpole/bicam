# [FEATURE] Add a component to the store

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #15)
> **Sprint:** `15-store-component-entity`
> **Estimate:** M

---

## 1. Summary

Replace the `components` placeholder with a real collection and add `addComponent`, so a caller can store a component
(type and model) and read it back.

---

## 2. Problem / Opportunity

- **Problem statement:** The app cannot hold components: `components` is always `{}` and nothing may write to it.
- **Evidence:** `ReservedSlice` in `src/store/types.ts`.
- **Success metric(s):** A valid component of each of the 16 types can be added and read from `components.byId`.

---

## 3. User Stories

### Story 1: Add a component
**As a** rider
**I want to** save a component with its type and model
**So that** I can track it

**Acceptance Criteria:**
- [ ] `INITIAL_APP_STATE.components` is `{ byId: {}, allIds: [] }`, frozen like `INITIAL_BICYCLE_COLLECTION`.
- [ ] Given valid input, `addComponent({ type, model })` returns `{ ok: true, component }` with a UUID v4 `id`, the
      trimmed `model`, and `history: []`; it is stored in `byId` and its id is appended to `allIds`.
- [ ] Each of the 16 types in [components.md §1](../docs/store/components.md#1-shape) is accepted.
- [ ] Two components with the same type and model are both stored.
- [ ] Edge case: extra keys in the input, including `id` and `history`, are ignored.
- [ ] `reset()` empties the collection.

**Out of scope:** writing to `history` (its entry type arrives with #24), editing and removing (#23).

### Story 2: Reject an invalid component
**As a** developer
**I want to** get every failing field as a code
**So that** a form can mark them all at once

**Acceptance Criteria:**
- [ ] `type`: blank → `required`; anything else not in the list, including `'toString'` and `'Chain'` → `invalidOption`.
- [ ] `model`: blank → `required`; over 60 characters after trimming → `tooLong`; control characters → `invalidFormat`.
- [ ] Both fields failing returns two errors, `type` first.
- [ ] On failure no id is generated and `components` keeps the same object reference.

**Out of scope:** suggestions or a list of known models.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [components.md §1–§2.1, §4, §5](../docs/store/components.md) | Shape, limits, `addComponent`, results |
| Existing pattern | `src/store/bicycle/` | File layout, slice, validator, tests |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/**`.
- **New files:** `src/store/components/{types,constants,createComponentsSlice}.ts`;
  `utilities/{createComponentId,isBicycleComponentType,normalizeComponentInput,validateComponent}.ts`; `__tests__/`.
- **Changed files:** `src/store/types.ts` (`components: ComponentCollection`; `AppStoreActions` also extends
  `ComponentActions`), `src/store/constants.ts`, `src/store/useAppStore.ts` (spread the slice),
  `src/store/__tests__/useAppStore.test.ts` (expected initial state).
- **Types:** `ComponentId` moves from `src/store/bicycle/types.ts` to `src/store/components/types.ts`. `history` is
  typed `ComponentHistoryEntry[]`, with a first version of that interface holding only `id`; #24–#26 add the fields.
- **Actions:** create `ComponentActions` in `src/store/components/types.ts` with `addComponent`. Later tickets add their
  actions to it.
- **Type list:** keep `BicycleComponentType` a literal union and `COMPONENT_TYPES` an array in `constants.ts`. In the
  test, compare it with the keys of a `Record<BicycleComponentType, true>`, so a missing type fails the typecheck or
  the test. Narrow `type` with `isBicycleComponentType`, not with an `as` cast.
- **Shared code:** move `checkText` and `CONTROL_CHARACTER_PATTERN` to `src/store/common/`. `checkText` then returns a
  `TextErrorCode` (`'required' | 'tooLong' | 'invalidFormat'`) instead of `BicycleErrorCode`.
- **Docs:** [store README](../docs/store/README.md) §1 (root shape and table), §3 (file layout with `components/` and
  `common/`).
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** [#23](./23-edit-remove-component.md)
- **Risks/open questions:** `components.byId` changes the type of a root key. `App.stories.tsx` and `App.test.tsx`
  spread `INITIAL_APP_STATE`, so they should need no change.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Store tests passing (`npm run test:store`); 90% branch threshold met
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [ ] JSDoc on every function and type; store docs updated
- [ ] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#23](./23-edit-remove-component.md), [#24](./24-record-component-install.md)
- Design file: [docs/store/components.md](../docs/store/components.md)
