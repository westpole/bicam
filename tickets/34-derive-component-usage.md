# [FEATURE] Derive component distance and wear

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** S

---

## 1. Summary

Add `getComponentUsage`, a pure function that returns a component's own distance, the distance since it was installed,
and its chain care state. It is the contract for the later events manager.

---

## 2. Problem / Opportunity

- **Problem statement:** Distance is not stored, so every reader would have to work it out.
- **Evidence:** [Contract for the events manager](./plan.md#contract-for-the-events-manager).
- **Success metric(s):** Both [worked example](./plan.md#worked-example) tables pass as tests.

---

## 3. User Stories

### Story 1: Know how far a component was ridden
**As a** rider
**I want to** see each component's own distance
**So that** I can replace it in time, whatever the bicycle's total is

**Acceptance Criteria:**
- [x] `distance` and `distanceSinceInstalled` match the first three steps of the usage table, including 1400 km and 4500
      km since installed for chain A and the cassette.
- [x] Includes `initialDistance`, a move between bicycles, and closed periods on a removed bicycle. Results have at most
      1 decimal (0.1 + 0.2 gives 0.3).
- [x] A component that was never used has its `initialDistance` and `null` since installed.
- [x] A limit counts as reached at or above its value; the function itself does not decide that.

**Out of scope:** indoor distance.

---

### Story 2: Know the state of a chain
**As a** rider
**I want to** know the last stretch and the distance since lubrication and cleaning
**So that** I can care for the chain in time

**Acceptance Criteria:**
- [x] The care table passes. A top-up does not change `distanceSinceCleaning`; a clean restarts both.
- [x] The newest entry wins by date, also when entries were added out of order; on equal dates, the last one added.
- [x] A newest entry without a distance gives `null`; a distance above the current one gives 0.
- [x] Entries about a subcomponent are ignored. Other types give `null` for all care values.

**Out of scope:** deciding that something is due.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md](./plan.md#contract-for-the-events-manager) | Contract and tie rules |
| Existing pattern | `src/store/components/utilities/getInstalledComponents.ts` | Pure reader with JSDoc |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/components/utilities/getComponentUsage.ts`. It reads no date and writes nothing.
- It returns a new object on each call, so `App` must memoize it, not select it.
- **Docs:** [components.md](../docs/store/components.md): usage contract.
- **Test lane:** `npm run test:store`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#31](./31-record-bicycle-distance.md), [#33](./33-keep-usage-valid.md)
- **Blocks:** [#35](./35-assign-while-adding.md), [#36](./36-show-and-swap-components.md)
- **Risks/open questions:** `npm run quality:unused` reports the function as unused until #35.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Store tests passing; 90% branch threshold met
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function and type; docs updated
- [x] `code-reviewer` subagent run and findings addressed
- [x] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 34)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#31](./31-record-bicycle-distance.md), [#33](./33-keep-usage-valid.md),
  [#35](./35-assign-while-adding.md), [#36](./36-show-and-swap-components.md)
- Design: [plan.md, Design](./plan.md#design)
