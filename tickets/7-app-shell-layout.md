# [FEATURE] Two-row app shell with pinned header and scrollable main viewport

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) — #4
> **Sprint:** `4-ui-introduce-application-grid-and-theme-setup`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** M

---

## 1. Summary

Replace the centered splash in `App.tsx` with a mobile-first, full-height two-row grid. Row 1 is a header pinned to the
top that shows the `Bicam` title. Row 2 is a `<main>` viewport that fills the remaining height and is the only element
that scrolls vertically.

---

## 2. Problem / Opportunity

- **Problem statement:** The app has no frame. Every future screen needs a stable header and a scroll region that
  behaves the same on phones (dynamic browser chrome) and in the Electron window.
- **Evidence:** [src/App.tsx](../src/App.tsx) renders a single centered `<main>` with `minHeight: 100vh`.
- **Success metric(s):** On the Storybook `mobile1` viewport (320 × 568) and the e2e web portrait viewport (412 × 915) with overflowing content, the header never moves, and `document.scrollingElement.scrollTop` stays `0` while `<main>` scrolls.

---

## 3. User Stories

### Story 1: Header always visible
**As a** rider browsing my maintenance journal on a phone
**I want to** keep the app header in view while I scroll
**So that** the title (and, later, the menu) is always reachable

**Acceptance Criteria:**
- [x] Given the app loads, then a `<header>` (banner landmark) sits at the top, containing the `<h1>` "Bicam" (`t('app.title')`, `Typography variant="h6" component="h1" noWrap`).
- [x] Given `<main>` has more content than fits, when I scroll it, then the header's position does not change.
- [x] The header uses `AppBar component="header" position="static"` + `Toolbar`, so its height comes from the MUI Toolbar mixins: 56px by default, 48px in landscape under 600px wide, and 64px at 600px wide and up (including the 915 × 412 e2e landscape viewport). No height is hard-coded in the component or in tests.
- [x] Edge case: a very long title truncates with an ellipsis instead of wrapping (`noWrap`).

**Out of scope:** The menu button (#8), navigation, and actions on the right side of the header.

---

### Story 2: Main viewport fills the rest and scrolls
**As a** rider
**I want to** have the content area use all of the remaining screen height and scroll on its own
**So that** nothing is cut off and the page never jumps when the mobile browser bar hides

**Acceptance Criteria:**
- [x] The shell is a `Box` with `display: grid`, `gridTemplateRows: 'auto minmax(0, 1fr)'`, `height: 100vh` with a `@supports (height: 100dvh)` override to `100dvh`, and `overflow: hidden`.
- [x] `<main>` has `overflowY: 'auto'`, `overscrollBehaviorY: 'contain'`, `minHeight: 0`, and responsive padding `p: { xs: 2, sm: 3 }`.
- [x] `<main>` has `tabIndex={0}` and a visible `:focus-visible` outline. Given keyboard focus on `<main>`, when I press ↓ / Page Down, then it scrolls (axe `scrollable-region-focusable` passes even with non-focusable content).
- [x] Given content shorter than the viewport, then `<main>` still stretches to the bottom edge (no gap under it).
- [x] Given content taller than the viewport, then only `<main>` shows a scrollbar and `<body>` does not scroll.
- [x] `App.tsx` renders `<AppShell>` and keeps syncing `document.title` with `t('app.title')`.
- [x] The existing `src/__tests__/App.test.tsx` keeps passing unchanged.

**Out of scope:** Real content for `<main>` (stories use placeholder fixtures), Zustand state, and safe-area insets.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Wireframes | [docs/design/app-shell-and-theme.md §2](../docs/design/app-shell-and-theme.md#2-wireframes) | Mobile portrait/landscape and desktop layouts |
| Layout spec | [docs/design/app-shell-and-theme.md §3](../docs/design/app-shell-and-theme.md#3-layout-specification) | Exact `sx` values and why CSS grid on `Box` rather than the `Grid` component |
| Existing root view | [src/App.tsx](../src/App.tsx), [src/App.stories.tsx](../src/App.stories.tsx) | Title and `document.title` behavior to keep |

**Text fallback:** a full-height column. At the top is a flat bar with "Bicam" in white on teal (light mode) or on a dark
surface (dark mode). Below it, a padded area fills the rest of the screen and scrolls on its own.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** React/MUI UI in `src/ui/components/**`, plus the composition in `src/App.tsx`.
- **New files:**
  - `src/ui/components/AppShell/AppShell.tsx`: `{ header: ReactNode; children: ReactNode }` (props type in a sibling `types.ts`).
  - `src/ui/components/AppHeader/AppHeader.tsx`: AppBar + Toolbar + title. #8 adds the menu button here.
  - Tests beside each component (`*.test.tsx`, react lane) and stories (`*.stories.tsx`, `layout: 'fullscreen'`).
- **Stories:** use the `storybook-expert` skill.
  - `AppShell` → `Desktop`, `Mobile` (`mobile1`, 320 × 568), `MobileLandscape` (`mobile1` rotated, 568 × 320, which shows the 48px toolbar), and `Dark`. Each has a long placeholder list in `<main>`.
  - Play functions assert the banner and main landmarks, that `<main>` is scrollable (`scrollHeight > clientHeight`), and that `<main>` has `tabindex="0"`.
  - The `Dark` story also asserts that the banner's computed `background-color` equals the dark `background.paper` token from the design doc's §4.2 (`#161D1D` → `rgb(22, 29, 29)`), and that it is **not** the dark `primary.main` (`#4DB6AC` → `rgb(77, 182, 172)`). Compare against literal `rgb(...)` values or a small color-normalizing helper. Do not compare against `theme.palette.AppBar.darkBg`: in MUI 9 that is a `var(--mui-palette-background-paper)` reference, not a color, so it never equals a computed value. This is the check that #6 hands off. Wait for the scheme switch first (`waitFor`/`expect.poll`, see #6 §5), because the decorator applies the mode in an effect.
  - All `AppShell` stories set `parameters: { a11y: { test: 'error' } }`.
  - Update `src/App.stories.tsx` Desktop/Mobile and the `Dark` story (added in #6) to also assert the `banner` landmark.
- **Unit tests:** react lane (`npm run test:react`).
  - Render inside `<ThemeProvider theme={theme}>` so the #6 AppBar defaults apply.
  - Cover the landmarks, the h1 text, `tabIndex` on `<main>`, and the `<main>` scroll styles via `getComputedStyle` (overflow-y `auto`).
- **Non-functional:** one `<h1>`; `banner` and `main` landmarks; no layout shift when the content changes length. i18n: reuse `app.title` (no new keys).
- **Feature flag:** none.

---

## 6. Dependencies & Risks

- **Blocked by:** [#6](./6-light-dark-theme.md) (AppBar defaults and palette)
- **Blocks:** [#8](./8-header-menu-button.md)
- **Risks/open questions:**
  - `e2e/ui/layout.spec.ts` "centers the title" tests and the visual snapshots **will fail** after this ticket. That is expected, and #9 fixes them before the batch → master PR. Do not run e2e as the gate for this ticket.
  - jsdom does not do layout, so scroll behavior is checked in Storybook play tests (real browser) and in e2e (#9), not in React unit tests.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests and story play tests written and passing (`npm run test:react`, `npm run test:storybook`)
- [x] `npm run test:all:coverage` meets the `src/ui/**` and `src/App.tsx` thresholds (90/85/90/90)
- [x] `npm run typecheck` and `npm run lint` pass
- [ ] Design review: matches the wireframes in the design doc's §2
- [x] Accessibility check passed (`a11y.test: 'error'` on the new stories: landmarks, scrollable region focusable)
- [x] Desktop, mobile, and dark stories added
- [x] `code-reviewer` subagent run, findings addressed
- [x] Committed directly on `4-ui-introduce-application-grid-and-theme-setup` (no ticket branch) as `<type>: #4 <description>`

---

## 8. Links

- Parent epic: [plan.md](./plan.md) (#4)
- Related tickets: [#6](./6-light-dark-theme.md), [#8](./8-header-menu-button.md), [#9](./9-e2e-app-shell-alignment.md)
- PR(s): —
- Design file: [docs/design/app-shell-and-theme.md](../docs/design/app-shell-and-theme.md)
