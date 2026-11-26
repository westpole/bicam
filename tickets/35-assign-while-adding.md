# [FEATURE] Assign a component while adding it

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** M

---

## 1. Summary

Let the rider choose a bicycle on the "Add component" form, and put new components in use when there is room, also from
the include dialog.

---

## 2. Problem / Opportunity

- **Problem statement:** A new component would rest on its bicycle and collect no distance.
- **Evidence:** `addComponentToBicycle` and `updateBicycle` only link ids.
- **Success metric(s):** Adding one chain to a new bicycle puts it in use; a second one rests.

---

## 3. User Stories

### Story 1: Assign and start in one action
**As a** developer
**I want to** link a component and start it in one write
**So that** nothing is half done

**Acceptance Criteria:**
- [x] `addComponentToBicycle(bicycleId, input, use?)` and a new `assignComponent(bicycleId, componentId, use?)` link the
      component and, with `use`, start it. `use` is `{ date, odometer, replaces? }`.
- [x] Nothing is stored when any part fails, and errors keep their field names.
- [x] `assignComponent` rejects an unknown bicycle or component, a full bicycle, and a component on another bicycle.

**Out of scope:** taking a component off a bicycle.

---

### Story 2: Choose the bicycle on the form
**As a** rider
**I want to** put a new component on a bicycle while adding it
**So that** I do it in one step

**Acceptance Criteria:**
- [x] The form has "Bicycle" ("None" by default) and, with a bicycle, "In use now".
- [x] "In use now" starts on when the type has room on that bicycle, and off otherwise. The rider can change it.
- [x] When it is on and the type is full, the form asks which component to replace. With one candidate it is
      preselected.
- [x] Use starts at the bicycle's current odometer, today.
- [x] Saved with a bicycle: its details open. Saved without: as in #30.

**Out of scope:** a late start; the rider can swap with an earlier reading in #36.

---

### Story 3: Include a component
**As a** rider
**I want to** include a component as before
**So that** the quick path stays quick

**Acceptance Criteria:**
- [x] The dialog keeps its fields. New and spare components start in use when the type has room, and rest otherwise.
- [x] Each spare option shows type, model, label (if any), and distance, so three identical chains can be told apart. A
      story shows this.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Screens](./plan.md#screens) | Add component; rule 2 |
| Existing pattern | `BicycleDetails/IncludeComponentDialog.tsx` | Callbacks and errors |

No mockups; follow the existing screens and the MUI theme.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layers:** store `src/store/useAppStore.ts`; UI `AddComponent`, `BicycleDetails`, `App.tsx`; translations.
- Put "has room" in one pure store utility, used by the form and the dialog.
- The include flow runs in e2e (`e2e/fixtures/shell.ts`); run it in Docker.
- **Docs:** `docs/design/add-component.md`, [bicycle-details.md](../docs/design/bicycle-details.md),
  [components.md](../docs/store/components.md) §4.
- **Test lanes:** `npm run test:store`, `npm run test:react`, `npm run test:storybook`, e2e in Docker.

---

## 6. Dependencies & Risks

- **Blocked by:** [#30](./30-add-spare-component.md), [#34](./34-derive-component-usage.md)
- **Blocks:** [#36](./36-show-and-swap-components.md)
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
- [x] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 35)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#30](./30-add-spare-component.md), [#34](./34-derive-component-usage.md),
  [#36](./36-show-and-swap-components.md)
- Design: [plan.md, Design](./plan.md#design)
