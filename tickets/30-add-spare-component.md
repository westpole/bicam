# [FEATURE] Add a spare component from the menu

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** M

---

## 1. Summary

Replace the "Add component" placeholder with a form that stores a spare component: type, model, label, starting
distance, and limits.

---

## 2. Problem / Opportunity

- **Problem statement:** The menu screen does nothing, and identical chains cannot be told apart.
- **Evidence:** `src/ui/components/screens/AddComponent/AddComponent.tsx` renders `ScreenPlaceholder`.
- **Success metric(s):** A rider can add three identical chains, labelled A, B, and C, without leaving the screen.

---

## 3. User Stories

### Story 1: Validate the new fields
**As a** developer
**I want to** pass `label`, `initialDistance`, and `limits` to the component actions
**So that** the form can save them

**Acceptance Criteria:**
- [ ] `addComponent` and `updateComponent` accept them, with the limits in [Data](./plan.md#data-saved-data-version-2).
      `null` clears one limit.
- [ ] Limits that are left out (all of `limits`, or one key): `addComponent` uses the type's defaults; `updateComponent`
      keeps the stored values. A type change in `updateComponent` starts from the new type's defaults instead, before
      validation.
- [ ] Errors use the fields `label`, `initialDistance`, and `limits.<name>`, at most one per field, in field order.
- [ ] A limit of 0 is `outOfRange`. Chain-only limits on another type are `notAllowed`.
- [ ] `updateComponent` rejects a new `initialDistance` with `notAllowed` once a whole-component history entry has a
      distance. An unchanged value is accepted.

**Out of scope:** an edit screen.

---

### Story 2: Add a spare component
**As a** rider
**I want to** add a component from the menu
**So that** it is stored before I put it on a bicycle

**Acceptance Criteria:**
- [ ] The form has type, model, label, starting distance, and replacement distance. Stretch, top-up, and cleaning limits
      show only for a chain.
- [ ] Choosing a chain fills 0.5 %, 300 km, and 1500 km. Changing the type replaces only limits the rider has not
      edited.
- [ ] For other types, the form drops chain-only limits from the input, also edited ones, so a hidden field never blocks
      a save.
- [ ] The stretch hint says 0.5 % for 11–13-speed and 0.75 % for 5–10-speed chains.
- [ ] A rejected save shows every invalid field and focuses the first one; editing a field clears its error. A failure
      that belongs to no field shows as an alert.
- [ ] Text that is not a number is rejected, not saved as empty.
- [ ] After a save, the form clears, focus returns to the first field, and a message names the component.
- [ ] **Cancel** returns to `home` and drops the draft.

**Out of scope:** choosing a bicycle (#35).

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Screens](./plan.md#screens) | Add component |
| Existing pattern | `src/ui/components/screens/AddBicycle/` | Form, errors, focus, stories |
| Existing pattern | `BicycleDetails/IncludeComponentDialog.tsx` | Type select and error texts |

No mockups; follow the existing screens and the MUI theme.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layers:** store `src/store/components/**`; UI `src/ui/components/screens/AddComponent/`; translations.
- The form takes props from `App`, so `addComponent` leaves `PropLessScreen` and `SCREEN_COMPONENTS`. Update
  `Placeholders.stories.tsx` and `screens.test.tsx` in `src/ui/components/screens/`, and the "Add component" navigation
  tests in `src/__tests__/App.test.tsx`.
- Share the component error texts with the include dialog instead of copying them.
- **Docs:** a new `docs/design/add-component.md`; [components.md](../docs/store/components.md) §2 and §4.
- **Test lanes:** `npm run test:store`, `npm run test:react`, `npm run test:storybook`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#29](./29-save-version-2-shape.md)
- **Blocks:** [#35](./35-assign-while-adding.md)
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
- [ ] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 30)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#29](./29-save-version-2-shape.md), [#35](./35-assign-while-adding.md)
- Design: [plan.md, Design](./plan.md#design)
