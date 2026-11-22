# [FEATURE] Add the sliding `AppMenu` screen and the `AppShell` overlay slot

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (#6)
> **Sprint:** `6-menu-introduce-and-set-placeholders`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** M

---

## 1. Summary

Add an `overlay` slot to `AppShell` that shares `<main>`'s grid cell, and an `AppMenu` component that slides down
from the top on open and back up on close (ease-out), listing the four menu options with `VerticalList`.

---

## 2. Problem / Opportunity

- **Problem statement:** The menu must appear inside the shell, below the header, with a slide animation.
- **Evidence:** Requirements "menu screen should be displayed in the AppShell view" and "slide from the top / slide to the top, ease-out"; [design §4.4–4.5](../docs/design/app-menu.md#44-appshell-changes--overlay-slot).
- **Success metric(s):** The menu covers row 2 only and animates in both directions with the theme's ease-out curve.

---

## 3. User Stories

### Story 1: Overlay slot in the shell
**As a** developer
**I want to** render an overlay in the same grid cell as `<main>`
**So that** screens like the menu can cover the viewport without covering the header

**Acceptance Criteria:**
- [ ] Given `overlay`, then it renders in a box with `grid-row: 2`, `grid-column: 1`, `overflow: hidden`, and `pointer-events: none`, after `<main>` in the DOM; `<main>` has `grid-row: 2`, `grid-column: 1`.
- [ ] Given `overlayOpen` is `true`, then `<main>` has the `inert` attribute; otherwise it does not.
- [ ] Without `overlay`, the shell renders exactly as before (existing tests and stories pass unchanged).

**Out of scope:** Multiple overlays, overlay stacking order beyond `<main>`.

### Story 2: Sliding menu
**As a** user
**I want to** see the menu slide down from under the header and slide back up when it closes
**So that** opening and closing feel connected to the menu button

**Acceptance Criteria:**
- [ ] Given `open` is `false`, then no navigation landmark is in the DOM.
- [ ] Given `open` becomes `true`, then a `navigation` named "Main menu" with `id="app-menu"` mounts and lists, in order: "Add bicycle", "Add component", "Add clothes set", "Before ride check-in".
- [ ] The transition is MUI `Slide` `direction="down"`; enter takes `enteringScreen` (225ms) and exit `leavingScreen` (195ms), both with `theme.transitions.easing.easeOut`.
- [ ] Given `open` becomes `false`, then the menu slides up and unmounts after the exit transition.
- [ ] When an option is chosen, `onSelect` is called with its `MenuScreen` id; the option matching `activeScreen` has `aria-current="page"`.
- [ ] When Escape is pressed inside the menu, `onClose` is called.
- [ ] After opening, focus moves to the first option; after closing, focus returns to the element focused before opening.
- [ ] Edge case: with `prefers-reduced-motion: reduce`, the transition timeout is 0.
- [ ] The panel never paints over the header during the animation (clipped by the overlay box).

**Out of scope:** Store wiring (#15), swipe gestures, side drawer.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design spec | [docs/design/app-menu.md §2.2–2.3, §4.4–4.5](../docs/design/app-menu.md#45-appmenu-srcuicomponentsappmenu) | Wireframe, animation, props |
| Existing similar component | `src/ui/components/AppShell/` | `constants.ts` sx pattern |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** React/MUI UI: `src/ui/components/AppShell/` (props, `OVERLAY_SX`, `MAIN_SX` grid placement) and `src/ui/components/AppMenu/` (`AppMenu.tsx`, `types.ts`, `constants.ts` with `APP_MENU_ID` and `MENU_ITEMS`, tests, stories).
- `Slide` needs a `container` element: keep the overlay box element in state via a callback ref inside `AppMenu` (wrap the Slide in a full-size `Box`), not from `AppShell`.
- `useMediaQuery('(prefers-reduced-motion: reduce)')` picks the timeout.
- Translations: `menu.label`, `menu.items.*`.
- Stories: `AppMenu` Desktop, Mobile, Dark, and `ActiveOption`, rendered inside an `AppShell` so the overlay cell and clipping are realistic; `AppShell` gets a `WithOverlay` story.
- **Test lanes:** `npm run test:react`, `npm run test:storybook`.

---

## 6. Dependencies & Risks

- **Blocked by:** #10, #11
- **Blocks:** #15
- **Risks/open questions:** Transition timing in happy-dom: assert on mount/unmount with `waitFor` and on the `transition` style string, not on in-between frames.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests and stories written and passing
- [ ] Accessibility check passed (Storybook a11y `error`)

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#11](./11-vertical-list-component.md), [#15](./15-wire-menu-into-app.md)
- Design file: [docs/design/app-menu.md](../docs/design/app-menu.md)
