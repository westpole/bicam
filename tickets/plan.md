# Plan: Application grid and MUI theme

> **Process:** follow [README.md](./README.md) for how plans and tickets are generated.
> **Batch branch:** `4-ui-introduce-application-grid-and-theme-setup` (already exists, created from `master` at `eda0272`). All work is committed directly on this branch with ticket number `#4`; there are no ticket branches. It intentionally does not follow the README's `dev-<yyyymmdd>-<slug>` convention.
> **Batch issue:** #4
> **Batch status:** Draft
> **Design:** [docs/design/app-shell-and-theme.md](../docs/design/app-shell-and-theme.md)

## Goal

Replace the centered splash screen with a mobile-first app shell and set up the MUI theme. The shell is a two-row grid:
a header pinned to the top with a menu button (SVG icon) and the `Bicam` title, and a main viewport that fills the
remaining height and scrolls vertically. Light and dark color schemes follow the OS. The batch is done when the
batch → master PR is green in CI, including the e2e jobs.

### Starting point

Verified on 2026-11-21 on branch `4-ui-introduce-application-grid-and-theme-setup` (`011907c`):

- Stack: React 19, `@mui/material` ^9.5.0 (Emotion), i18next 26, Vite 8, Electron 45, Storybook 10, Vitest 5.
- `@mui/icons-material` is **not** installed. The menu icon will be a local `createSvgIcon` component, so no dependency is added.
- [src/ui/theme/index.ts](../src/ui/theme/index.ts) is `createTheme({ colorSchemes: { light: true, dark: true } })` with no palette, no CSS variables, and no component overrides.
- [src/App.tsx](../src/App.tsx) renders `<main>` with `minHeight: 100vh` and a centered `h3`-styled `<h1>` "Bicam". It also syncs `document.title`.
- `src/ui/components/` does not exist yet. `src/store/` is empty.
- Translations: only `app.title` = "Bicam".
- Storybook decorator ([.storybook/preview.tsx](../.storybook/preview.tsx)) wraps stories in `ThemeProvider` + `CssBaseline`. It cannot switch color schemes yet.
- These tests depend on the current layout:

  | Test | Dependency | Addressed by |
  | --- | --- | --- |
  | `src/__tests__/App.test.tsx` | `<h1>` "Bicam", `document.title` | #7 (must keep passing) |
  | `src/App.stories.tsx` | `<h1>` "Bicam" on Desktop/Mobile | #6 (adds the `Dark` story and `a11y.test: 'error'`), #7 (adds `banner` assertions), #8 (adds menu button assertions) |
  | `e2e/ui/layout.spec.ts` | Title **centered** in the window, before and after resize | #9 (rewrite) |
  | `e2e/ui/layout.spec.ts` | Body background changes with `prefers-color-scheme` | #6 must keep it working; #9 verifies |
  | `e2e/visual/app.spec.ts` + snapshots | Existing `light theme` / `dark theme` baselines show the splash screen | #9 (regenerate both in Docker) |
  | `e2e/mobile/app.spec.ts`, `e2e/electron/smoke.spec.ts`, `e2e/integration/security.spec.ts` | `<h1>` exists / named "Bicam" | Kept passing by keeping the title as `<h1>` |

- Storybook a11y is configured as `a11y: { test: 'todo' }` (warn only). Stories added in this batch set `parameters: { a11y: { test: 'error' } }` so contrast and landmark violations actually fail. The repo-wide default is not changed.
- Coverage thresholds in `vitest.config.ts`: `src/ui/**` and `src/App.tsx` at 90/85/90/90 (statements/branches/functions/lines). All new UI files fall under them.
- MUI Toolbar height: 56px by default, 48px in landscape **under 600px wide**, 64px at ≥ 600px. The e2e landscape project (915 × 412) therefore gets 64px. Tests measure the header instead of hard-coding a height.
- Reference viewports: Storybook `mobile1` (320 × 568) for mobile stories; e2e `web-mobile-portrait` (412 × 915) and `web-mobile-landscape` (915 × 412).
- CI (`.github/workflows/pr-tests-runner.yml`) runs lint, typecheck, `test:all`, **and** e2e (web + electron, in Docker) on PRs to `master`. That is why e2e alignment is its own ticket rather than skipped.
- Ruled out: the MUI `Grid` component for the outer shell. It is a 12-column flex grid and cannot express "auto row + remaining-height row" cleanly. The shell uses MUI System CSS grid on `Box`; see the design doc, §3.
- Ruled out: `AppBar position="fixed"`. It needs an offset spacer, and content can slide under it. The grid row already pins the header.

### Workflow

> Workflow for an agent picking up tickets from this batch. **For this batch, this plan overrides
> [README.md](./README.md)'s default workflow, branching, and merge rules** (dev branch, ticket branches, squash-merge,
> "Dev → master" PR). It differs from the README default mainly in two ways (the other differences, such as no
> per-ticket `In Review` status and `Done` being set at commit time, follow from these):
> - **Single branch, single ticket number:** all work is committed directly on the current branch
>   `4-ui-introduce-application-grid-and-theme-setup`, and every commit uses ticket number **#4**. There are no ticket
>   branches and no squash-merges. Ticket numbers #6–#9 only identify the ticket files for tracking; they are never used as the
>   `#<ticket>` prefix of a commit message or in branch names. A plain-text suffix such as `(ticket 6)` is encouraged
>   for traceability. Keep it as plain text, not `#6`: on GitHub `#6` autolinks to issue/PR #6, which is unrelated.
> - **e2e gate:** step 5 makes ticket #9 the e2e gate for the batch (the README default skips e2e entirely).
>
> Assumes a small project with a single developer: one ticket in progress at a time.

1. Pick the highest-priority ticket in the [Tickets](#tickets) table whose status is `Ready for Dev` and whose **Blocked by** tickets are all `Done`.
2. Set its status to `In Progress` in both the ticket file and the table.
3. Check out `4-ui-introduce-application-grid-and-theme-setup` and pull it. Do **not** create a ticket branch (see [Branching rules](#branching-rules)).
4. Implement the ticket in its owning layer (see `CLAUDE.md` → Code Ownership), add/update tests and stories.
5. Run verification locally — CI only runs on PRs to `master`, so the local run is the gate for each ticket's commit:
   `npm run typecheck`, `npm run lint`, the narrowest test lane, then `npm run test:all` if cross-cutting, and
   `npm run test:all:coverage` for tickets that add `src/ui/**` files.
   **Deviation from the README default:** skip e2e (`npm run test:e2e*`) for tickets #6–#8; it needs a Docker image to match the CI environment. Ticket #9 is the e2e gate for this batch.
6. Run the `code-reviewer` subagent and address findings.
7. Commit on `4-ui-introduce-application-grid-and-theme-setup` using `<type>: #4 <description>`. Mention the ticket file in the description, for example `feat: #4 add light/dark theme (ticket 6)`. Include the ticket's status update to `Done` in the same commit, then unblock dependent tickets.
8. When every ticket is `Done`, push the branch, open the PR to `master`, and set **Batch status** to `In Review`.

### Branching rules

| Branch | Name | Created from | Merges into |
| --- | --- | --- | --- |
| Batch (the only branch) | `4-ui-introduce-application-grid-and-theme-setup` (existing) | `master` | `master`, once per batch |

- All commits for tickets #6–#9, plus plan/ticket status updates, go directly on this branch.
- Do not create ticket branches, and do not commit to `master` or any other branch.
- Every commit message uses ticket number **#4** (from the branch name, per `CLAUDE.md` → Commits), never #6–#9:
  `<type>: #4 <description>`.

### Merge rules

- **Within the batch:** no merges except syncing with `master` (below); commits land on the batch branch in order, one or more per ticket.
- **Batch → master:** open a PR from `4-ui-introduce-application-grid-and-theme-setup` to `master` (this is where CI
  runs) and merge with a **merge commit** (no squash, no rebase) so the batch's commits stay in `master` history.
  - PR title / merge commit: `merge: #4 app-shell-and-theme into master`.
  - PR description: link this plan and the design doc, and list tickets #6–#9.
- **Syncing with master:** single-developer assumption — `master` rarely moves during a batch. If it does,
  merge `master` into the batch branch before starting the next ticket. Do not rebase it.
- **After the batch merges:** delete the batch branch and set **Batch status** to `Done`.

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- A ticket requires changing the Electron security posture (`contextIsolation`, `nodeIntegration`, `sandbox`).
- Acceptance criteria are ambiguous or contradict another ticket.
- A direct dependency upgrade or release is needed (`/npm-upgrade`, `/release-workflow` are user-invoked only).
- The batch branch is behind `master` and merging `master` into it produces conflicts.
- The batch branch recorded in the header does not exist, or the current branch is not that branch when about to commit.
- Adding any dependency (including `@mui/icons-material`). The menu icon must be a local SVG component.
- Loosening the Content-Security-Policy in `index.html` (for example to load web fonts or external images).
- The palette in the design doc's §4.2 fails WCAG AA in the Storybook a11y check (`a11y.test: 'error'` on the new stories). Ask before choosing other colors.

### Open questions

| # | Question | Default if unanswered | Blocks |
| --- | --- | --- | --- |
| 1 | ~~Keep the existing branch or create `dev-20261121-app-shell-and-theme`?~~ **Resolved:** commit everything on `4-ui-introduce-application-grid-and-theme-setup` with ticket number `#4`. | — | — |
| 2 | Is the teal/orange palette in the design doc's §4.2 acceptable? | Use the proposal | — (#6's acceptance criteria refer to the §4.2 tokens, not hex codes, so a different palette only edits §4.2 and `src/ui/theme/constants.ts`; #6 stays `Ready for Dev`) |
| 3 | What should the menu button open (a drawer with navigation? which items?) | Button renders, clicking does nothing; a later batch adds the behavior | — (out of scope here) |
| 4 | Is a manual light/dark toggle wanted, or is following the OS enough? | Follow the OS only | — (out of scope here) |

### Definition of done

> Applies to the batch as a whole. Each ticket also has its own Definition of Done (section 7 of the ticket template).

- [ ] All tickets in the table are `Done` and committed on `4-ui-introduce-application-grid-and-theme-setup` as `<type>: #4 <description>`
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all`, and `npm run test:all:coverage` (thresholds met) pass locally on the batch branch
- [ ] Batch → master PR is green in CI (including both e2e jobs) and merged with a merge commit
- [ ] Desktop and mobile stories exist for any changed UI, plus a dark-scheme story for the shell. The new stories pass with `a11y.test: 'error'`
- [ ] Documentation updated where behavior changed ([design doc](../docs/design/app-shell-and-theme.md) status set to `Implemented`)
- [ ] With a long list in `<main>`, on Storybook `mobile1` (320 × 568) and the e2e web portrait/landscape viewports, the header stays visible while the content scrolls, and `<body>` itself does not scroll
- [ ] `<main>` is keyboard-scrollable (`tabIndex={0}`, the second tab stop after the menu button)
- [ ] Switching the OS color scheme switches the app between the light and dark palettes without a reload
- [ ] No new runtime dependencies in `package.json`

### Tickets

> - One row per ticket. Ticket files live next to this plan as `tickets/<number>-<short-slug>.md`
>   and follow [docs/AgileTicketTemplate.md](../docs/AgileTicketTemplate.md).
> - **Type:** Feature / Bug / Chore / Refactor / Test / Docs / Spike
> - **Priority:** P0 (critical) / P1 (high) / P2 (medium) / P3 (low)
> - **Size:** XS / S / M / L / XL
> - **Status:** Draft / Ready for Dev / In Progress / In Review / Done — must match the ticket file's header.
> - **Blocked by:** comma-separated ticket numbers, or `—` if none.

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#6](./6-light-dark-theme.md) | Light/dark MUI theme that follows the OS | Feature | P1 | S | Done | — |
| [#7](./7-app-shell-layout.md) | Two-row app shell with pinned header and scrollable main viewport | Feature | P1 | M | Ready for Dev | 6 |
| [#8](./8-header-menu-button.md) | Header menu button with a scalable SVG icon | Feature | P1 | S | Ready for Dev | 7 |
| [#9](./9-e2e-app-shell-alignment.md) | Align e2e specs and visual snapshots with the app shell | Test | P1 | S | Ready for Dev | 8 |

Each feature ticket is a vertical slice: it changes what the user sees, and it ships with its own translations, unit
tests, and desktop/mobile stories, so it can be merged and demoed on its own.

### Expected end state

- User-visible: the app opens to a header with `≡  Bicam` pinned at the top and an empty, scrollable main area. Colors follow the OS light/dark setting.
- Code:
  - `src/ui/theme/index.ts`: CSS-variables theme with light/dark palettes, AppBar defaults, and mobile-first conventions documented in JSDoc.
  - `src/ui/components/AppShell/`, `src/ui/components/AppHeader/`, `src/ui/components/icons/MenuIcon.tsx`: each with tests and stories.
  - `src/App.tsx`: composes `AppShell` and keeps the `document.title` sync.
  - `src/i18n/locales/en/translation.json`: adds `header.menuButton.label`.
  - `.storybook/preview.tsx`: a color-scheme toolbar global (light/dark/system).
- Tests: the existing `App.test.tsx` keeps passing unchanged. It renders without `ThemeProvider`, so the new React tests render inside the app theme to cover the theme, shell, header, and icon. Storybook play tests cover Desktop/Mobile/Dark with the a11y gate. `e2e/ui/layout.spec.ts` (Electron) is rewritten and `e2e/mobile/app.spec.ts` (web) is extended with the same shell checks. The two existing visual baselines (light/dark) are regenerated.
- No change to Electron main, security posture, CSP, or dependencies.
