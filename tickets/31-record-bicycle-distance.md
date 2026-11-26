# [FEATURE] Record a bicycle's distance

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** M

---

## 1. Summary

Let the rider set a bicycle's odometer, or add a ride to it, on the bicycle details screen.

---

## 2. Problem / Opportunity

- **Problem statement:** There is no source of distance, so nothing can be tracked.
- **Evidence:** `Bicycle` has no odometer, and there are no rides.
- **Success metric(s):** A rider can enter 300 km and see it on the bicycle after a restart.

---

## 3. User Stories

### Story 1: Set the odometer
**As a** developer
**I want to** set a bicycle's odometer through one action
**So that** every component on it can derive its distance

**Acceptance Criteria:**
- [x] `setBicycleOdometer(id, { odometer, date })` stores both and returns a `BicycleResult`.
- [x] 0–500 000 with at most 1 decimal; a wrong number or date uses the usual codes. An unknown bicycle is `notFound`,
      returned alone.
- [x] A reading below the latest boundary of any period with that `bicycleId` is `outOfRange` ([rule
      6](./plan.md#rules)). Periods of spare components and of components on another bicycle count.
- [x] A lower reading at or above that boundary is accepted.

**Out of scope:** a log of readings.

---

### Story 2: Update the distance
**As a** rider
**I want to** enter the bicycle's total, or add a ride
**So that** I can use whichever number I have

**Acceptance Criteria:**
- [x] Bicycle details show the odometer in km, and its date or "Not specified".
- [x] **Update distance** opens a dialog with "Set total" or "Add ride", a distance, and a date that defaults to today.
- [x] "Add ride" saves the current total plus the ride, rounded to 1 decimal.
- [x] A total that is too low says which reading is the lowest allowed.
- [x] Cancel, Escape, and a click outside drop the draft. Closing returns focus to the button.

**Out of scope:** importing rides, indoor distance.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Screens](./plan.md#screens) | Bicycle details, Update distance |
| Existing pattern | `BicycleDetails/IncludeComponentDialog.tsx` | Dialog mounting, errors, focus |

No mockups; follow the existing screens and the MUI theme.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layers:** store `src/store/bicycle/**`; UI `src/ui/components/screens/BicycleDetails/`; translations.
- The bicycle slice may read `components` and never writes it.
- Store tests for rule 6 set usage periods directly, because starting a component arrives with #32.
- "Today" comes from the UI; the store has no clock.
- `bicycle-details-*` visual snapshots change; update them in Docker.
- **Docs:** [bicycle.md](../docs/store/bicycle.md), [bicycle-details.md](../docs/design/bicycle-details.md).
- **Test lanes:** `npm run test:store`, `npm run test:react`, `npm run test:storybook`, visual e2e in Docker.

---

## 6. Dependencies & Risks

- **Blocked by:** [#29](./29-save-version-2-shape.md)
- **Blocks:** [#34](./34-derive-component-usage.md)
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Store tests passing; 90% branch threshold met
- [x] React tests passing; desktop and mobile stories added or updated, with the a11y check passing
- [x] All new text goes through `t()`, with keys in the English file
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function and type; docs updated
- [x] `code-reviewer` subagent run and findings addressed
- [x] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 31)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#29](./29-save-version-2-shape.md), [#34](./34-derive-component-usage.md)
- Design: [plan.md, Design](./plan.md#design)
