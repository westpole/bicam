# [FEATURE] Add reusable `VerticalList` component

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (#6)
> **Sprint:** `6-menu-introduce-and-set-placeholders`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Add a reusable `VerticalList` component that renders a list of labelled items stacked vertically, each as a
full-width button, so the menu and later screens share one list implementation.

---

## 2. Problem / Opportunity

- **Problem statement:** The menu needs a vertical list of options, and later screens (bicycles, components) will
  need the same pattern. Building it inline in the menu would get copied.
- **Evidence:** [Design §4.1](../docs/design/app-menu.md#41-verticallist-srcuicomponentsverticallist--reusable).
- **Success metric(s):** `AppMenu` (#14) renders its options with `VerticalList` and no custom list markup.

---

## 3. User Stories

### Story 1: Render and choose items
**As a** user
**I want to** see options stacked top to bottom and pick one by click, tap, or keyboard
**So that** lists are easy to scan and operate on any device

**Acceptance Criteria:**
- [ ] Given `items`, then one `listitem` per item renders in the given order inside a `list`, each containing a native `<button>` named by the item's `label`.
- [ ] When an item is clicked, or focused and Enter/Space is pressed, then `onItemClick` is called once with that item's `id`.
- [ ] Given `selectedId`, then only that item's button has `aria-current="page"` and MUI `Mui-selected`.
- [ ] Given `aria-label`, then the `list` has that accessible name. Given `divided`, each row has a bottom divider.
- [ ] Edge case: given `items=[]`, an empty list renders without errors.
- [ ] Rows are at least 48px tall and full width at `mobile1` (320px).

**Out of scope:** Icons, secondary text, links, drag-and-drop, virtualization.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design spec | [docs/design/app-menu.md §4.1](../docs/design/app-menu.md#41-verticallist-srcuicomponentsverticallist--reusable) | Props and markup |
| Existing similar component | `src/ui/components/AppHeader/` | File layout (`types.ts`, tests, stories) |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** React/MUI UI, `src/ui/components/VerticalList/` (`VerticalList.tsx`, `types.ts`, `VerticalList.test.tsx`, `VerticalList.stories.tsx`).
- MUI `List` → `ListItem disablePadding divider={divided}` → `ListItemButton component="button" selected aria-current` → `ListItemText`.
- Stories: Desktop, Mobile (`mobile1`), Selected, Dark, with `a11y: { test: 'error' }`.
- **Test lanes:** `npm run test:react`, `npm run test:storybook`.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** #14
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests and stories written and passing
- [ ] Accessibility check passed (Storybook a11y `error`)

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#14](./14-app-menu-screen.md)
- Design file: [docs/design/app-menu.md](../docs/design/app-menu.md)
