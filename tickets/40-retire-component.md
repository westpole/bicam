# [FEATURE] Retire and restore a component

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** M

---

## 1. Summary

Let the rider retire a worn-out component: it leaves its bicycle, keeps its distance and care history, is no longer
offered for use, and can be restored.

---

## 2. Problem / Opportunity

- **Problem statement:** After a replacement the worn part would rest on the bicycle for good, with "Use now" available.
- **Evidence:** Only resting is possible in #32–#36.
- **Success metric(s):** A worn chain can be replaced by a new one in one step, and no longer shows as resting or spare.

---

## 3. User Stories

### Story 1: Retire and restore in the store
**As a** developer
**I want to** retire a component in one write
**So that** it is never half removed

**Acceptance Criteria:**
- [ ] `retireComponent(componentId, { date, odometer? })` follows [rule 13](./plan.md#rules), in one `set`: closes the
      open period at `odometer` (required when in use; rule 5), takes it off its bicycle, and stores
      `retired: { date, bicycleId }`.
- [ ] `restoreComponent(componentId)` puts it back on that bicycle, resting, and clears `retired`. When the bicycle was
      removed, the component becomes spare. A full bicycle is `tooMany` on `components`.
- [ ] Unknown component: `notFound` on `componentId`, returned alone. Retiring one that is on no bicycle or already
      retired, or restoring one that is not retired: `notAllowed` on `componentId`.
- [ ] With `replaces`, `startComponentUse`, `assignComponent`, and `addComponentToBicycle` accept `retireReplaced`,
      which retires the replaced component in the same `set`, with the same date and reading. `retireReplaced` without
      `replaces` is `required` on `replaces`, also when the type has room.
- [ ] Retiring a component in use without `odometer` is `required` on `odometer`. For a resting one, `odometer` is
      ignored.
- [ ] A retired component cannot be assigned or started: `assignComponent` and `startComponentUse` return `notAllowed`
      on `componentId`; `addBicycle` and `updateBicycle` return `notAllowed` on `components`.
- [ ] `getSpareComponents` leaves out retired components. `getComponentUsage` still returns their values.
- [ ] `undoComponentStart` also restores a replaced component that was retired from this bicycle, and reopens its
      period, in one `set` ([rule 10](./plan.md#rules)). When the bicycle is full, nothing comes back.
- [ ] Test: after a swap with `retireReplaced` at a wrong reading, undo and then a lower odometer work.

**Out of scope:** retiring a spare component.

---

### Story 2: Retire from the screen
**As a** rider
**I want to** retire a worn part, also while replacing it
**So that** only usable parts are offered

**Acceptance Criteria:**
- [ ] Rows in use and resting have **Retire**. It asks first, with date (today) and, when in use, odometer (current).
- [ ] The swap dialog and the replacement choice on the "Add component" form have "Retire the replaced component", off
      by default.
- [ ] Bicycle details show a **Retired** list when the bicycle has retired components: type, model, label, distance,
      date, and **Restore**. No other actions.
- [ ] The undo dialog names a retired component that comes back, or says that the bicycle is full.
- [ ] Afterwards focus moves to the component's new row.

**Out of scope:** deleting components, and a screen for retired components of a removed bicycle; the store can restore
them as spare.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Rules](./plan.md#rules) | Rules 5, 10, 11, and 13 |
| Existing pattern | #36 swap dialog, #38 undo | Dialogs and focus |

No mockups; follow the existing screens and the MUI theme.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layers:** store `src/store/useAppStore.ts` and slices; UI `BicycleDetails`, `AddComponent`, `App.tsx`;
  translations.
- The `retired` field, its migration, and its shape check come with #29.
- `BicycleErrorCode` gets `notAllowed`; every place that lists its codes needs a text.
- `bicycle-details-*` snapshots change. An e2e step replaces and retires a chain, then restores it.
- **Docs:** [components.md](../docs/store/components.md), [bicycle.md](../docs/store/bicycle.md) §5,
  [bicycle-details.md](../docs/design/bicycle-details.md), `docs/design/add-component.md`.
- **Test lanes:** `npm run test:store`, `npm run test:react`, `npm run test:storybook`, e2e in Docker. Stories on
  desktop and mobile.

---

## 6. Dependencies & Risks

- **Blocked by:** [#36](./36-show-and-swap-components.md), [#38](./38-undo-component-start.md)
- **Blocks:** —
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Store tests passing; 90% branch threshold met
- [ ] React tests passing; desktop and mobile stories added or updated, with the a11y check passing
- [ ] All new text goes through `t()`, with keys in the English file
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [ ] JSDoc on every function and type; docs updated
- [ ] `code-reviewer` subagent run and findings addressed
- [ ] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 40)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#36](./36-show-and-swap-components.md), [#38](./38-undo-component-start.md)
- Design: [plan.md, Design](./plan.md#design)
