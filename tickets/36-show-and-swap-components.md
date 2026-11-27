# [FEATURE] Show and swap components on bicycle details

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** M

---

## 1. Summary

Show which components are in use and which rest, with their distances, and let the rider swap them.

---

## 2. Problem / Opportunity

- **Problem statement:** The list shows type and model only, so three chains look the same and none can be put in use.
- **Evidence:** `ComponentList` is read-only and gets stored components.
- **Success metric(s):** The first three usage steps of the [worked example](./plan.md#worked-example) can be done in
  the app and survive a restart.

---

## 3. User Stories

### Story 1: See what is in use
**As a** rider
**I want to** see components in use and resting, with distances
**So that** I know what is on the bicycle

**Acceptance Criteria:**
- [x] Two lists, **In use** and **Resting**; an empty one is not shown. Without components, the current message shows.
- [x] A row shows type, model, label, and distance. Rows in use add the distance since installed.
- [x] Chain rows show lubricant and stretch, lubrication, and cleaning against their limits. Text, not color alone, says
      when a limit is reached (the value is at or above the limit). Unknown values read "Not specified".
- [x] A type with components but none in use shows a notice that asks the rider to choose.

**Out of scope:** notifications.

---

### Story 2: Swap components
**As a** rider
**I want to** put a resting component in use
**So that** it collects distance from that moment

**Acceptance Criteria:**
- [x] **Use now** on a resting row opens a dialog with date (today), odometer (current), and, when the type is full, the
      component to replace (preselected when there is one).
- [x] A late reading splits the distance there. A rejected reading shows the allowed range.
- [x] When no chain is in use and none has usage periods (the state #29's three-chains fixture produces), a reading of 0
      credits the chosen chain with everything since then. Covered by a React test on that state.
- [x] Cancel, Escape, and a click outside drop the draft. After a save, focus moves to the component's row.

**Out of scope:** undo (#38).

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Screens](./plan.md#screens) | Bicycle details, Swap dialog |
| Existing component | `src/ui/components/ComponentList/` | Rows, mocks, stories |

No mockups; follow the existing screens and the MUI theme.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layers:** UI `src/ui/components/ComponentList/`, `BicycleDetails`, `App.tsx`; translations.
- `ComponentList` takes ready-to-show rows and an action slot. `App` derives usage with `getComponentUsage` in
  `useMemo`.
- The two lists rename the "Components" list that `e2e/fixtures/shell.ts` and `e2e/visual/app.spec.ts` look up. Update
  both, and the `bicycle-details-*` snapshots.
- New e2e: the worked example in `e2e/integration/persistence.spec.ts`, with a restart.
- **Docs:** [bicycle-details.md](../docs/design/bicycle-details.md).
- **Test lanes:** `npm run test:react`, `npm run test:storybook`, e2e in Docker. Stories on desktop and mobile.

---

## 6. Dependencies & Risks

- **Blocked by:** [#34](./34-derive-component-usage.md), [#35](./35-assign-while-adding.md)
- **Blocks:** [#37](./37-log-chain-care.md), [#38](./38-undo-component-start.md), [#40](./40-retire-component.md)
- **Risks/open questions:** Long rows on phones; check the mobile stories for overflow.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] React tests passing; desktop and mobile stories added or updated, with the a11y check passing
- [x] All new text goes through `t()`, with keys in the English file
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function and type; docs updated
- [x] `code-reviewer` subagent run and findings addressed
- [x] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 36)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#34](./34-derive-component-usage.md), [#35](./35-assign-while-adding.md),
  [#37](./37-log-chain-care.md), [#38](./38-undo-component-start.md), [#40](./40-retire-component.md)
- Design: [plan.md, Design](./plan.md#design)
