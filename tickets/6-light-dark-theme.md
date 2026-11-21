# [FEATURE] Light/dark MUI theme that follows the OS

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

Turn the empty theme in `src/ui/theme/index.ts` into the app's design foundation: CSS-variables color schemes with a
Bicam palette for light and dark mode, following the OS preference, plus a Storybook toolbar to preview either scheme.

---

## 2. Problem / Opportunity

- **Problem statement:** The theme only enables MUI's default light/dark schemes. There is no brand palette, no shared
  component defaults, and stories cannot be previewed in dark mode, so every later screen would invent its own colors.
- **Evidence:** [src/ui/theme/index.ts](../src/ui/theme/index.ts) is `createTheme({ colorSchemes: { light: true, dark: true } })`.
- **Success metric(s):** The App `Desktop`, `Mobile`, and `Dark` stories pass the Storybook a11y check with `a11y.test: 'error'` (so a
  contrast failure fails the test run), and switching the OS scheme changes the app colors without a reload.

---

## 3. User Stories

### Story 1: App colors follow my OS setting
**As a** rider using Bicam
**I want to** see the app in light or dark colors, matching my OS
**So that** it is comfortable to read in a bright workshop or at night

**Acceptance Criteria:**
- [ ] Given the OS prefers light, when the app loads, then `background.default`, `background.paper`, `primary.main`, and `secondary.main` equal the **Light** column of the design doc's §4.2.
- [ ] Given the OS prefers dark, when the app loads, then the same tokens equal the **Dark** column of §4.2.
- [ ] Given the app is open, when the OS scheme changes, then the colors switch without a reload (the existing e2e test "follows the system dark color scheme" still passes).
- [ ] The theme uses `cssVariables: { colorSchemeSelector: 'class' }` and defines both `colorSchemes.light.palette` and `colorSchemes.dark.palette` with the §4.2 tokens. The values live in a sibling `constants.ts` so a palette change touches one file.
- [ ] `shape.borderRadius` is `8`. `MuiAppBar` defaults to `color: 'primary'` and `elevation: 0`, with a 1px `divider` bottom border.
- [ ] The theme leaves `enableColorOnDark` off, so in dark mode an AppBar uses MUI's dark default: the dark `background.paper` background and `text.primary` text (MUI wires these through `palette.AppBar.darkBg`/`darkColor`), not `primary.main`. This ticket only asserts the theme's AppBar defaults, including that `enableColorOnDark` is not enabled (unit test). The app has no AppBar until #7, so the computed dark `background-color` is checked in #7's `AppShell` `Dark` story.
- [ ] Edge case: if the browser does not support `prefers-color-scheme`, the light scheme is used.

**Out of scope:** A manual theme toggle, storing the user's choice in Zustand, custom fonts, and per-component overrides beyond `MuiAppBar`.

---

### Story 2: Preview stories in both schemes
**As a** developer writing stories
**I want to** switch Storybook between light, dark, and system schemes from the toolbar
**So that** every component can be checked in both modes

**Acceptance Criteria:**
- [ ] Given Storybook is open, when I choose `dark` in the color-scheme toolbar, then the story re-renders with the dark palette.
- [ ] Given a story sets `globals: { colorScheme: 'dark' }`, when it runs in `npm run test:storybook`, then it renders in dark mode.
- [ ] Given a story with no `colorScheme` global, when it renders after a dark story, then it uses `system` mode: the decorator's effect always calls `setMode`, defaulting to `'system'`, so a mode MUI saved to `localStorage` from an earlier story or toolbar choice never leaks into it.
- [ ] `src/App.stories.tsx` gains a `Dark` story (desktop viewport) with a play assertion that the `<h1>` is visible.
- [ ] The App `Desktop`, `Mobile`, and `Dark` stories set `parameters: { a11y: { test: 'error' } }`. The repo-wide default stays `'todo'`.

**Out of scope:** Changing existing story viewports and adding new components.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design doc | [docs/design/app-shell-and-theme.md §4](../docs/design/app-shell-and-theme.md#4-theme-specification-srcuithemeindexts) | Theme config table and palette tokens with contrast ratios |
| Existing theme | [src/ui/theme/index.ts](../src/ui/theme/index.ts) | Current minimal config to extend |
| Storybook decorator | [.storybook/preview.tsx](../.storybook/preview.tsx) | Where the color-scheme global/decorator goes |

**Text fallback:** light mode uses a dark teal primary, a deep-orange secondary, and an off-white background. Dark
mode uses a lighter teal, a light orange, and a near-black teal-tinted background. The exact values are in §4.2.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** UI theme, `src/ui/theme/`. Storybook config is in `.storybook/preview.tsx`.
- **Affected files:** `src/ui/theme/index.ts`, `src/ui/theme/constants.ts` (palette tokens, per the `file-organization` skill), `src/ui/theme/index.test.tsx` (new, react lane), `.storybook/preview.tsx`, `src/App.stories.tsx`.
- **Storybook color scheme** (use the `storybook-expert` skill):
  - Declare the global in `preview.tsx`: `globalTypes.colorScheme` with a toolbar (items `light`, `dark`, `system`) and `initialGlobals: { colorScheme: 'system' }`, so the toolbar shows `system` as selected by default.
  - The decorator takes Storybook's context, `(Story, context) => …`, and reads `context.globals.colorScheme`.
  - It renders `<ThemeProvider>` containing a small child component (for example `ColorSchemeSync`) next to `<Story />`. `useColorScheme` only works below `ThemeProvider`, so the decorator function cannot call it itself.
  - The child calls `setMode(colorScheme ?? 'system')` from a `useEffect` keyed on the global, never during render. Calling it during render triggers React's "cannot update a component while rendering a different component" warning.
  - Because the effect runs after the first paint, a story briefly renders in the previous or system mode before switching. Play functions that check scheme-dependent colors must wait for the switch (`waitFor(...)` or `expect.poll(...)`, for example until `document.documentElement` has the `dark` class), not assert immediately.
- **localStorage:** MUI's storage manager is on by default for this theme and saves the mode once `setMode` runs. The app itself never calls `setMode` in this batch, so production stays on `system`. Storybook does call it, which is why the decorator always sets the mode explicitly.
- **Tests:** react lane (`npm run test:react`).
  - Assert the light and dark `palette` tokens against **literal hex values copied from the design doc's §4.2 table**, not against imports from `constants.ts`. The theme is built from `constants.ts`, so comparing against it could never fail. Also assert that `theme.vars` is defined (CSS variables on). If the palette changes (plan open question 2), update §4.2, `constants.ts`, and these expected values together.
  - Render a bare MUI `<AppBar>` **inside `<ThemeProvider theme={theme}>`** and assert the default props (`elevation` 0, `color` primary, `components.MuiAppBar.defaultProps.enableColorOnDark` falsy) and the bottom-border override. The existing `App.test.tsx` renders without the theme, so it does not cover them.
  - Run `npm run test:storybook` for the App `Desktop`, `Mobile`, and `Dark` stories and the a11y gate.
- **Non-functional:** WCAG AA contrast for every token pair, enforced by `a11y.test: 'error'` on the App stories. No CSP change. No new dependency.
- **Feature flag:** none.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** [#7](./7-app-shell-layout.md)
- **Risks/open questions:**
  - The palette is a proposal ([plan open question 2](./plan.md#open-questions)). The acceptance criteria refer to the design doc's §4.2 tokens, not hex codes, so a palette change edits §4.2 and `constants.ts` only. The criteria and this ticket's `Ready for Dev` status still hold.
  - A mode saved to `localStorage` could pin a scheme. That only happens after a `setMode` call: the Storybook decorator handles it, and Playwright starts with a fresh profile for each run.
  - If the §4.2 palette fails the a11y gate, stop and ask (see the plan's Exceptions).

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (`npm run test:react`, `npm run test:storybook`)
- [ ] `npm run test:all:coverage` meets the `src/ui/**` thresholds (90/85/90/90) for the theme files
- [ ] `npm run typecheck` and `npm run lint` pass
- [ ] Accessibility check passed (`a11y.test: 'error'` on the App Desktop/Mobile/Dark stories)
- [ ] Desktop, mobile, and dark stories updated
- [ ] `code-reviewer` subagent run, findings addressed
- [ ] Committed directly on `4-ui-introduce-application-grid-and-theme-setup` (no ticket branch) as `<type>: #4 <description>`

---

## 8. Links

- Parent epic: [plan.md](./plan.md) (#4)
- Related tickets: [#7](./7-app-shell-layout.md)
- PR(s): —
- Design file: [docs/design/app-shell-and-theme.md](../docs/design/app-shell-and-theme.md)
