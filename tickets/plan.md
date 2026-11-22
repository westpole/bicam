# Plan: App menu screen

> **Process:** follow [README.md](./README.md) for how plans and tickets are generated.
> **Dev branch:** `6-menu-introduce-and-set-placeholders` (exists; the user asked for all work to be committed on this branch, see [Workflow](#workflow))
> **Batch issue:** #6
> **Batch status:** In Progress
> **Design:** [docs/design/app-menu.md](../docs/design/app-menu.md)

## Goal

Turn the header menu button into a working menu: a menu screen slides down inside the `AppShell` (ease-out), the button
shows an `X` while it is open, the options **Add bicycle**, **Add component**, **Add clothes set**, and **Before ride
check-in** are rendered with a new reusable vertical list, and each option opens a placeholder screen. Done when every
ticket below is `Done` and `npm run typecheck`, `npm run lint`, and `npm run test:all` pass.

### Starting point

Verified on 2026-11-21 on branch `6-menu-introduce-and-set-placeholders` (at `ac963de`):

- React 19, MUI 9.5 (`@mui/material ^9.5.0`), Zustand `^5.0.16`, Vitest 5, Storybook 10. `@mui/icons-material` is not
  installed (icons are local `createSvgIcon` components).
- `AppShell` (`src/ui/components/AppShell/`) is a two-row grid: `header` prop in row 1, `<main tabIndex={0}>` in row 2.
  It has no overlay slot.
- `AppHeader` (`src/ui/components/AppHeader/`) renders a menu `IconButton` (`aria-label` "Open menu") with
  `MenuIcon`; `onMenuClick` is optional and unused by `App`.
- `src/store/` is empty. The `storybook-expert` skill already names the future store `useAppStore` in
  `src/store/useAppStore.ts` with types in `src/store/types.ts`. The `store` Vitest project runs
  `src/store/**/*.test.ts`.
- There is no list component and no screen other than the empty main viewport.
- Translations: `app.title`, `header.menuButton.label` only.
- E2E (`e2e/**`) runs in Docker in CI; visual baselines show the closed shell with an empty `<main>`.

Ruled out:

- `@mui/icons-material` for one `X` icon (same reasoning as `MenuIcon`).
- MUI `Drawer`/`Modal` for the menu: a modal portal covers the header and traps focus away from the toggle button.
  The requirement is a screen inside the `AppShell` that slides from the top while the header stays.
- A router: the four screens are placeholders; `activeScreen` in the store is enough.

### Workflow

> Changed from the default: the user asked for everything to be committed on the current branch, so there is no
> separate dev branch, no ticket branches, and no squash merges. Everything else is the default.

1. Pick the highest-priority ticket in the [Tickets](#tickets) table whose status is `Ready for Dev` and whose **Blocked by** tickets are all `Done`.
2. Set its status to `In Progress` in both the ticket file and the table.
3. Implement the ticket in its owning layer (see `CLAUDE.md` → Code Ownership), add/update tests and stories.
4. Run verification locally: `npm run typecheck`, `npm run lint`, the narrowest test lane, then `npm run test:all`
   if cross-cutting. Skip e2e (`npm run test:e2e*`); it needs the Docker image to match CI.
5. Run the `code-reviewer` subagent and address findings.
6. Commit on `6-menu-introduce-and-set-placeholders` as `<type>: #6 <description> (ticket <n>)` (one commit per
   ticket) and set status to `Done`.
7. When every ticket is `Done`, remove `plan.md` and the ticket files, mark the design doc `Implemented`, and commit.

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- A ticket requires changing the Electron security posture (`contextIsolation`, `nodeIntegration`, `sandbox`).
- Acceptance criteria are ambiguous or contradict another ticket.
- A direct dependency upgrade or release is needed (`/npm-upgrade`, `/release-workflow` are user-invoked only).
- A new npm dependency would be needed (for example an icon or animation library).

### Definition of done

- [ ] All tickets in the table are `Done` and committed on the branch
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally
- [ ] Desktop and mobile stories exist for all new and changed UI
- [ ] Design doc updated to `Implemented`
- [ ] `plan.md` and ticket files removed once implementation is finished

### Tickets

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#10](./10-app-store-menu-state.md) | Add `useAppStore` with menu and active-screen state | Feature | P1 | S | Ready for Dev | — |
| [#11](./11-vertical-list-component.md) | Add reusable `VerticalList` component | Feature | P1 | S | Ready for Dev | — |
| [#12](./12-header-menu-toggle.md) | Toggle the header menu icon to `X` when the menu is open | Feature | P1 | S | Ready for Dev | — |
| [#13](./13-menu-screen-placeholders.md) | Add placeholder screens for the four menu options | Feature | P2 | S | Ready for Dev | #10 |
| [#14](./14-app-menu-screen.md) | Add the sliding `AppMenu` screen and the `AppShell` overlay slot | Feature | P1 | M | Ready for Dev | #10, #11 |
| [#15](./15-wire-menu-into-app.md) | Wire the menu, header, and screens into `App` | Feature | P1 | M | Ready for Dev | #10, #12, #13, #14 |

### Expected end state

- Clicking ≡ slides the menu down under the header; the button shows ✕ and reads "Close menu". Clicking ✕, pressing
  Escape, or choosing an option slides it back up. Choosing an option shows that option's placeholder screen.
- New code: `src/store/{useAppStore,types,constants}.ts`; `src/ui/components/{VerticalList,AppMenu}/`;
  `src/ui/components/icons/CloseIcon.tsx`; `src/ui/components/screens/**`. Changed: `AppShell`, `AppHeader`, `App`,
  the English translation file.
- Existing shell tests, stories, and e2e checks keep passing unchanged (regression coverage). New unit tests, stories,
  and e2e menu checks are added per ticket.
