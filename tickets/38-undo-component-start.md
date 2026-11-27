# [FEATURE] Undo the last start of a component

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P2
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** S

---

## 1. Summary

Let the rider undo a wrong start or swap, so a wrong odometer reading can be corrected too.

---

## 2. Problem / Opportunity

- **Problem statement:** A swap made at a wrong reading (62000 instead of 6200) blocks lowering the odometer for good.
- **Evidence:** [Rule 6](./plan.md#rules).
- **Success metric(s):** The last step of the usage [worked example](./plan.md#worked-example) passes.

---

## 3. User Stories

### Story 1: Undo in the store
**As a** developer
**I want to** undo the open period of a component
**So that** its bicycle returns to the state before it

**Acceptance Criteria:**
- [x] `undoComponentStart(componentId)` follows [rule 10](./plan.md#rules), in one `set`. Unknown component: `notFound`
      on `componentId`, returned alone. Not in use: `notAllowed` on `componentId`.
- [x] Undoing a swap reopens the replaced period. Several undos in a row go back one swap at a time.
- [x] When the replaced component was removed, taken off the bicycle with `updateBicycle`, used again since, or its type
      has no room, nothing takes its place. (#40 extends undo to a replaced component that was retired.)
- [x] History entries stay. Afterwards the odometer can be lowered to the new latest boundary.

**Out of scope:** undoing a stop; start the component again at the same reading.

---

### Story 2: Undo on the screen
**As a** rider
**I want to** undo a mistaken swap
**So that** the distances are right again

**Acceptance Criteria:**
- [x] **Undo** shows on a row in use when its start replaced another component or is the latest boundary on the bicycle,
      and never when its start date is unknown.
- [x] It asks first, and names the component that comes back and the distance this one loses. When the replaced
      component cannot come back, it says why.
- [x] When the component has care entries with a distance above its distance after the undo, the dialog says so and
      points to Care history. It deletes nothing.
- [x] After it, focus moves to the component's row.

**Out of scope:** editing past periods.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Rules](./plan.md#rules) | Rules 6, 7, and 10 |
| Existing pattern | #36 swap dialog | Dialog and focus |

No mockups; follow the existing screens and the MUI theme.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layers:** store `src/store/components/**`; UI `BicycleDetails`, `App.tsx`; translations.
- Put "can be undone" in a pure utility, so the rule is tested without React.
- `bicycle-details-*` snapshots change.
- **Docs:** [components.md](../docs/store/components.md), [bicycle-details.md](../docs/design/bicycle-details.md).
- **Test lanes:** `npm run test:store`, `npm run test:react`, `npm run test:storybook`, e2e in Docker.

---

## 6. Dependencies & Risks

- **Blocked by:** [#36](./36-show-and-swap-components.md)
- **Blocks:** [#40](./40-retire-component.md)
- **Risks/open questions:** Undoing an old start removes its whole period; the dialog states the distance. Care history
  itself arrives with #39.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Store tests passing; 90% branch threshold met
- [x] React tests passing; desktop and mobile stories added or updated, with the a11y check passing
- [x] All new text goes through `t()`, with keys in the English file
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function and type; docs updated
- [x] `code-reviewer` subagent run and findings addressed
- [x] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 38)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#36](./36-show-and-swap-components.md), [#40](./40-retire-component.md)
- Design: [plan.md, Design](./plan.md#design)
