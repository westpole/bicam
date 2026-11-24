# [FEATURE] Edit and remove a history entry

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** [plan.md](./plan.md) (batch #15)
> **Sprint:** `15-store-component-entity`
> **Estimate:** S

---

## 1. Summary

Add `updateComponentHistoryEntry` and `removeComponentHistoryEntry`, so a caller can correct or delete one entry.

---

## 2. Problem / Opportunity

- **Problem statement:** A wrong date or distance stays in the history for good.
- **Evidence:** [components.md §4](../docs/store/components.md#4-input-normalization-and-actions).
- **Success metric(s):** Any field of any entry can be corrected, and any entry removed.

---

## 3. User Stories

### Story 1: Edit an entry
**As a** rider
**I want to** correct a history entry
**So that** my records are right

**Acceptance Criteria:**
- [ ] Only the given keys change. The entry keeps its `id` and its place in `history`; other entries keep their
      references.
- [ ] `null` or blank text clears an optional field; an omitted or `undefined` key is unchanged; an `id` key is ignored.
- [ ] The merged entry is validated by the same rules as a new one, for the component's type.
- [ ] An unknown component → `{ field: 'componentId', code: 'notFound' }`; an unknown entry →
      `{ field: 'id', code: 'notFound' }`. An entry of another component is unknown. Either
      error is returned alone.
- [ ] Edge case: an entry can be edited when the component already has 500 entries.
- [ ] A failed edit leaves `components` with the same object reference.

**Out of scope:** moving an entry to another component, reordering.

### Story 2: Remove an entry
**As a** rider
**I want to** delete a history entry
**So that** a record made by mistake does not mislead me

**Acceptance Criteria:**
- [ ] `removeComponentHistoryEntry(componentId, entryId)` returns `true` and removes only that entry.
- [ ] An unknown component or entry returns `false` and leaves state unchanged (same object reference).
- [ ] After the last conflicting entry is removed, a type change it blocked (#25) succeeds.

**Out of scope:** undo.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [components.md §4–§5](../docs/store/components.md#4-input-normalization-and-actions) | Action table, codes |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/components/`.
- **Files:** `types.ts` (new `ComponentHistoryUpdate`; extend `ComponentActions`), `createComponentsSlice.ts`, tests.
- Reuse `definedChanges`, `normalizeComponentHistoryInput`, and `validateComponentHistoryEntry`. The 500-entry check
  belongs to the add action, not to the validator.
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#26](./26-chain-care-history.md)
- **Blocks:** —
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Store tests passing (`npm run test:store`); 90% branch threshold met
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [ ] JSDoc on every function and type
- [ ] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#24](./24-record-component-install.md), [#26](./26-chain-care-history.md)
- Design file: [docs/store/components.md](../docs/store/components.md)
