# [FEATURE] Start, stop, and swap components in the store

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** M

---

## 1. Summary

Add store actions that put a component in use on its bicycle, take it out of use, and swap two components at one
odometer reading.

---

## 2. Problem / Opportunity

- **Problem statement:** Several chains can be on a bicycle, but nothing says which one is in use.
- **Evidence:** `Bicycle.components` only lists ids.
- **Success metric(s):** The usage steps of the [worked example](./plan.md#worked-example) can be written through the
  actions.

---

## 3. User Stories

### Story 1: Start and stop a component
**As a** rider
**I want to** say when a component goes into use and out of use
**So that** only the one in use collects distance

**Acceptance Criteria:**
- [ ] `startComponentUse(bicycleId, componentId, { date, odometer, replaces? })` adds an open period, or reopens the
      last one ([rule 7](./plan.md#rules)).
- [ ] `stopComponentUse(componentId, { date, odometer })` closes it. A zero-length period is dropped.
- [ ] Start and stop readings follow rules 4 and 5; otherwise `outOfRange` on `odometer`.
- [ ] The start and stop errors in the [error table](./plan.md#rules) are returned for their cases (undo comes with #38,
      the odometer with #31, retired components with #40). `notFound` is returned alone. A failed action keeps the same
      state references.

**Out of scope:** taking a component off the bicycle (#33).

---

### Story 2: Swap two components
**As a** rider
**I want to** swap chains in one action, also days later
**So that** the distance splits at the right reading

**Acceptance Criteria:**
- [ ] With `replaces`, both components change in one `set`, at the same reading, and the new period keeps the replaced
      period's id in `replacedPeriodId`.
- [ ] When the type is full, a start without `replaces` fails with `required`. When there is room, `replaces` is still
      accepted as a swap.
- [ ] Swapping A → B → A at one reading leaves A with one unbroken period and B with none.
- [ ] Swapping C → B → D at one reading leaves D with C's period in `replacedPeriodId`.
- [ ] Chains: a swap before the latest chain swap fails. Wheels: a late swap of one wheel works after a newer swap of
      the other one.
- [ ] A reopened period keeps its own `replacedPeriodId`. A start that replaces a period that stays always adds a new
      period.

**Out of scope:** undo (#38).

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Rules](./plan.md#rules) | Rules 1, 3–5, 7, and 12; error table |
| Existing pattern | `src/store/components/createComponentsSlice.ts` | Result objects, immutable writes |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/components/**`. The slice reads `bicycle` and writes only `components`.
- Put the capacity check (rule 4, second part) in one pure utility with its own tests. Treat periods as half-open: a
  period ending at 1500 and one starting at 1500 do not overlap.
- Name it `startComponentUse`, not `useComponent`, which reads like a React hook.
- **Docs:** [components.md](../docs/store/components.md): usage, actions, error codes.
- **Test lane:** `npm run test:store`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#29](./29-save-version-2-shape.md)
- **Blocks:** [#33](./33-keep-usage-valid.md)
- **Risks/open questions:** The capacity rule is the most intricate part of the batch; cover limits of 1, 2, and none.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Store tests passing; 90% branch threshold met
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [ ] JSDoc on every function and type; docs updated
- [ ] `code-reviewer` subagent run and findings addressed
- [ ] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 32)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#29](./29-save-version-2-shape.md), [#33](./33-keep-usage-valid.md)
- Design: [plan.md, Design](./plan.md#design)
