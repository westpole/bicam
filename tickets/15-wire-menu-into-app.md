# [FEATURE] Wire the menu, header, and screens into `App`

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

Connect `App` to `useAppStore` so the header button toggles the menu, the menu navigates to the chosen placeholder
screen, and `<main>` renders the active screen.

---

## 2. Problem / Opportunity

- **Problem statement:** #10–#14 deliver the parts; users only benefit when they are wired together.
- **Evidence:** [Design §4.7](../docs/design/app-menu.md#47-app-wiring).
- **Success metric(s):** The full flow works in the web and Electron builds.

---

## 3. User Stories

### Story 1: Open and close the menu
**As a** rider
**I want to** open the menu with ≡ and close it with ✕ or Escape
**So that** I can reach the app's actions from anywhere

**Acceptance Criteria:**
- [ ] Given the app just loaded, then the menu is closed, the button reads "Open menu", and `<main>` is empty.
- [ ] When the button is clicked, the menu opens below the header, the button reads "Close menu" with ✕, and `<main>` is `inert`.
- [ ] When ✕ is clicked or Escape is pressed, the menu closes and focus returns to the menu button.

### Story 2: Choose an option
**As a** rider
**I want to** choose a menu option
**So that** I land on that screen

**Acceptance Criteria:**
- [ ] When "Add component" is chosen, the menu closes and `<main>` shows the "Add component" placeholder heading.
- [ ] Reopening the menu marks "Add component" with `aria-current="page"`.
- [ ] Edge case: the header title stays the only `<h1>` on every screen.

**Out of scope:** Real screens, routing, persistence.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design spec | [docs/design/app-menu.md §4.7](../docs/design/app-menu.md#47-app-wiring) | Wiring snippet |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** `src/App.tsx` (root view) with atomic store selectors. No component other than `App` reads the store.
- Tests: `src/__tests__/App.test.tsx` uses the real store, reset in `beforeEach` (`useAppStore.setState(INITIAL_APP_STATE)`).
- Stories: `src/App.stories.tsx` resets the store in a decorator; add `MenuFlow` (desktop), `MenuFlowMobile`, `MenuOpenDark`.
- E2E: add menu open/choose checks to `e2e/mobile/app.spec.ts` and `e2e/ui/layout.spec.ts` (run in CI/Docker).
- **Test lanes:** `npm run test:react`, `npm run test:storybook`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** #10, #12, #13, #14
- **Blocks:** —
- **Risks/open questions:** E2E cannot be run locally without the Docker image; CI on the PR is the gate.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests, stories, and e2e checks written; unit and story tests passing
- [ ] Accessibility check passed (Storybook a11y `error`)
- [ ] Design doc marked `Implemented`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#10](./10-app-store-menu-state.md)–[#14](./14-app-menu-screen.md)
- Design file: [docs/design/app-menu.md](../docs/design/app-menu.md)
