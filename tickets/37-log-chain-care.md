# [FEATURE] Log chain stretch, lubrication, and cleaning

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P2
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** M

---

## 1. Summary

Add a dialog on chain rows that records what was done (measured, topped up, or cleaned and relubricated), with oil or
wax and the stretch.

---

## 2. Problem / Opportunity

- **Problem statement:** Chain care cannot be recorded in the app.
- **Evidence:** `addComponentHistoryEntry` has no UI.
- **Success metric(s):** The care steps of the [worked example](./plan.md#worked-example) can be done in the app.

---

## 3. User Stories

### Story 1: Log care
**As a** rider
**I want to** record care on a chain
**So that** I know when it is due again

**Acceptance Criteria:**
- [x] **Log care** shows on chain rows, in use and resting.
- [x] "Measured only" needs a stretch value. "Topped up" saves `lubricated` and `lubricant`. "Cleaned and relubricated"
      also saves the same date as `cleaned`. Stretch is optional for the last two.
- [x] For "topped up" and "cleaned and relubricated", oil or wax is preset to the last lubricant and required. "Measured
      only" does not ask for it.
- [x] A top-up with a different lubricant than the last one shows a warning that the chain should be cleaned first. It
      can still be saved.
- [x] The row updates at once: a top-up restarts only the lubrication distance, a clean restarts both.

**Out of scope:** other component types.

---

### Story 2: Log care late
**As a** rider
**I want to** enter care from some days ago
**So that** it counts from the right distance

**Acceptance Criteria:**
- [x] For a chain in use, the dialog asks for the odometer (current by default) and fills in the distance of that
      moment.
- [x] A reading above the odometer is rejected. A reading before the chain's current installation is rejected with a
      message that asks the rider to enter the chain's distance instead; the odometer field can then be left empty.
- [x] A resting chain has no odometer field; the current distance is filled in. The distance can be edited and is capped
      at `COMPONENT_LIMITS.distanceMax`.
- [x] `installed` is the first usage start date, or the entry's date when that is unknown or the chain was never used.

**Out of scope:** editing a saved entry; delete it and log it again (#39).

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, History readings](./plan.md#history-readings) | Distance of that moment |
| Existing pattern | `BicycleDetails/IncludeComponentDialog.tsx` | Dialog, errors, focus |

No mockups; follow the existing screens and the MUI theme.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layers:** UI `BicycleDetails`, `App.tsx`; translations. The store already validates the entry (#29).
- Put the distance of a past reading in a pure, tested utility.
- `bicycle-details-*` snapshots change; the e2e flow adds the care steps.
- **Docs:** the meaning of `distance` in [components.md](../docs/store/components.md) §2.2 and §6 (no earlier ticket
  writes it); [bicycle-details.md](../docs/design/bicycle-details.md).
- **Test lanes:** `npm run test:react`, `npm run test:storybook`, e2e in Docker. Stories on desktop and mobile.

---

## 6. Dependencies & Risks

- **Blocked by:** [#36](./36-show-and-swap-components.md)
- **Blocks:** [#39](./39-care-history.md)
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] React tests passing; desktop and mobile stories added or updated, with the a11y check passing
- [x] All new text goes through `t()`, with keys in the English file
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function and type; docs updated
- [x] `code-reviewer` subagent run and findings addressed
- [x] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 37)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#36](./36-show-and-swap-components.md), [#39](./39-care-history.md)
- Design: [plan.md, Design](./plan.md#design)
