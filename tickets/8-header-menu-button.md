# [FEATURE] Header menu button with a scalable SVG icon

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) — #4
> **Sprint:** `4-ui-introduce-application-grid-and-theme-setup`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Add a menu button to the start of the header, left of the `Bicam` title. Its icon is a local inline-SVG
`MenuIcon` built with `createSvgIcon`, so CSS controls its color and size and it stays sharp at any resolution. No
icon package is added.

---

## 2. Problem / Opportunity

- **Problem statement:** The spec calls for a menu entry point in the header. A raster image or icon font would blur at
  some sizes and ignore the light/dark scheme. `@mui/icons-material` would add a large dependency for a single icon.
- **Evidence:** `@mui/icons-material` is not in `package.json`. The header from #7 only has a title.
- **Success metric(s):** The icon follows the AppBar text color in both schemes and resizes through `fontSize`/`sx`, with no new dependency.

---

## 3. User Stories

### Story 1: See and reach the menu button
**As a** rider
**I want to** see a familiar menu button at the top-left
**So that** I know where navigation will live

**Acceptance Criteria:**
- [x] Given the app loads, then the header shows, in order: the menu button, then the `<h1>` "Bicam".
- [x] The button is `IconButton edge="start" color="inherit" size="large"` (a hit area of at least 48 × 48px).
- [x] The button's accessible name is `t('header.menuButton.label')` = "Open menu" (key added to `src/i18n/locales/en/translation.json` first).
- [x] Given keyboard navigation, when I press Tab from page load, then the menu button is the first element to get focus and shows the MUI focus ring. The next Tab moves to `<main>` (from #7).
- [x] Given I click the button, then nothing breaks: no navigation, no console error. `AppHeader` accepts an optional `onMenuClick` prop for the future drawer.
- [x] Edge case: on a 320px-wide viewport, the button and title stay on one line (the title truncates and the button never shrinks).

**Out of scope:** Drawer/navigation behavior, `aria-expanded`/`aria-controls` (added together with the drawer), and Zustand menu state.

---

### Story 2: Icon scales and recolors with CSS
**As a** developer
**I want to** have a `MenuIcon` component that behaves like any MUI `SvgIcon`
**So that** I can size and color it through the theme, `fontSize`, or `sx`

**Acceptance Criteria:**
- [x] `src/ui/components/icons/MenuIcon.tsx` exports a `MenuIcon` built with `createSvgIcon` (display name `Menu`) and has JSDoc.
- [x] It renders an inline `<svg viewBox="0 0 24 24">` that draws three equal horizontal bars (see the design doc's §5 for a reference path), with `fill: currentColor` and `aria-hidden="true"`.
- [x] Given `fontSize="small" | "medium" | "large"` or `sx={{ fontSize: 40 }}`, then the rendered size changes accordingly.
- [x] Given light and dark schemes, then the icon color equals the AppBar text color.
- [x] `package.json` dependencies are unchanged.

**Out of scope:** Other icons, and an icon registry.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Wireframes | [docs/design/app-shell-and-theme.md §2](../docs/design/app-shell-and-theme.md#2-wireframes) | Position of `≡` relative to the title |
| Icon spec | [docs/design/app-shell-and-theme.md §5](../docs/design/app-shell-and-theme.md#5-menu-icon) | SVG path, sizing, a11y, CSP note |
| Header component | `src/ui/components/AppHeader/` (from #7) | Where the button is inserted |

**Text fallback:** three equal horizontal bars (a "hamburger") at the left edge of the header, the same color as the
title text, followed by the "Bicam" title.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** React/MUI UI (`src/ui/components/icons/`, `src/ui/components/AppHeader/`) and translations (`src/i18n/locales/en/translation.json`).
- **Affected files:** `MenuIcon.tsx` (+ `MenuIcon.test.tsx`, `MenuIcon.stories.tsx` with `layout: 'centered'` showing the sizes and both schemes), `AppHeader.tsx`, its `types.ts` (`onMenuClick?: () => void`), test, and stories, and the English translation file.
- **Stories:** update `AppHeader` and `App` Desktop/Mobile/Dark play functions to assert `getByRole('button', { name: 'Open menu' })` is visible. New `MenuIcon` stories and the updated `AppHeader` stories set `parameters: { a11y: { test: 'error' } }`.
- **Tests:** react lane (`npm run test:react`), rendered inside `<ThemeProvider theme={theme}>`. Cover the accessible name, the click calling `onMenuClick`, the SVG attributes, and the button coming before the h1 in DOM order. Storybook lane for visuals.
- **Non-functional:** WCAG 2.5.5 target size, 3:1 icon contrast in both schemes, translated label. The inline SVG needs no CSP change.
- **Feature flag:** none.

---

## 6. Dependencies & Risks

- **Blocked by:** [#7](./7-app-shell-layout.md)
- **Blocks:** [#9](./9-e2e-app-shell-alignment.md)
- **Risks/open questions:** what the button opens is undecided ([plan open question 3](./plan.md#open-questions)). It does not block this ticket.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests and story play tests written and passing (`npm run test:react`, `npm run test:storybook`)
- [x] `npm run test:all:coverage` meets the `src/ui/**` thresholds (90/85/90/90) for `MenuIcon` and `AppHeader`
- [x] `npm run typecheck` and `npm run lint` pass
- [x] Accessibility check passed (`a11y.test: 'error'`: accessible name, focus order, contrast)
- [x] Desktop, mobile, and dark stories updated
- [x] No new dependencies
- [x] `code-reviewer` subagent run, findings addressed
- [x] Committed directly on `4-ui-introduce-application-grid-and-theme-setup` (no ticket branch) as `<type>: #4 <description>`

---

## 8. Links

- Parent epic: [plan.md](./plan.md) (#4)
- Related tickets: [#7](./7-app-shell-layout.md), [#9](./9-e2e-app-shell-alignment.md)
- PR(s): —
- Design file: [docs/design/app-shell-and-theme.md](../docs/design/app-shell-and-theme.md)
