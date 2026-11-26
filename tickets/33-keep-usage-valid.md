# [FEATURE] Keep usage valid when components or bicycles are removed

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** S

---

## 1. Summary

Close open usage periods when a component leaves its bicycle or the bicycle is removed, and write both slices in one
`set`.

---

## 2. Problem / Opportunity

- **Problem statement:** Removing a component from a bicycle would leave an open period on a bicycle that does not list
  it, and saved data in that state cannot be loaded.
- **Evidence:** `removeComponent` and `addComponentToBicycle` in `src/store/useAppStore.ts` write with two `set` calls,
  and `persist` saves after each one.
- **Success metric(s):** No state seen by a subscriber breaks [rule 1](./plan.md#rules).

---

## 3. User Stories

### Story 1: Keep the distance of removed parts
**As a** rider
**I want to** have a part keep its distance when it leaves a bicycle
**So that** I can use it again later

**Acceptance Criteria:**
- [x] `updateBicycle` without a listed component closes that component's open period at the bicycle's odometer and
      odometer date.
- [x] `removeBicycle` does the same for every component in use on it. Closed periods keep the removed bicycle's id.
- [x] Both store actions drop a zero-length period.
- [x] Ids added with `addBicycle` or `updateBicycle` get no period.

**Out of scope:** UI for taking a component off a bicycle.

---

### Story 2: Never save a broken state
**As a** developer
**I want to** have each action write once
**So that** saved data can always be loaded

**Acceptance Criteria:**
- [x] `updateBicycle`, `removeBicycle`, `removeComponent`, and `addComponentToBicycle` notify subscribers once per call.
- [x] A rejected `updateBicycle` (duplicate name, for example) leaves usage unchanged and keeps the same references.
- [x] A subscriber that checks `isPersistedAppState` on every update never sees `false`.
- [x] Removing the selected bicycle still returns to `home`, in the same update.

**Out of scope:** —

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Rules](./plan.md#rules) | Rules 1, 8, and 11 |
| Existing pattern | `src/store/useAppStore.ts` | Wrappers around slice actions |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/useAppStore.ts` and pure helpers in the slices.
- Pure functions, shared with the slice actions, return the next collection or the errors; the wrapper writes both keys
  in one `set`.
- `updateBicycle` finds the removed ids by comparing the old and new lists.
- **Docs:** replace the two-`set` decision in [store README](../docs/store/README.md) §5 and the wrapper order in
  [components.md](../docs/store/components.md) §4.
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#32](./32-start-stop-swap-components.md)
- **Blocks:** [#34](./34-derive-component-usage.md)
- **Risks/open questions:** Existing tests may assert two notifications; change them only where the new behavior is
  intended.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Store tests passing; 90% branch threshold met
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function and type; docs updated
- [x] `code-reviewer` subagent run and findings addressed
- [x] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 33)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#32](./32-start-stop-swap-components.md), [#34](./34-derive-component-usage.md)
- Design: [plan.md, Design](./plan.md#design)
