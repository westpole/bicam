# Plan: Bicycle card list

> **Process:** follow [README.md](./README.md) for how plans and tickets are generated.
> **Batch branch:** `10-ui-introduce-bicycle-list` (created from `master` after batch #8 was merged in PR #9)
> **Batch issue:** #10 (from the branch name; used in every commit message of this batch)
> **Batch status:** Draft

## Goal

Show the user's bicycles on the `home` screen as a reusable, vertically stacked list of `Paper` cards (bike image on the
left; name on row 1 and a row reserved for event icons on row 2). Clicking a card opens a Bicycle details placeholder
for that bicycle. Event icons themselves are deferred to the batch that implements the `events` slice. Done when all
tickets are merged and the checks in [Definition of done](#definition-of-done) pass.

Design: [docs/design/bicycle-card-list.md](../docs/design/bicycle-card-list.md).

### Starting point

Verified on 2026-11-22 on branch `8-store-bicycle-entity` (commit `215e7b0`, merged into `master` as `3e05fd3`):

- `home` renders nothing: `App` shows `SCREEN_COMPONENTS[activeScreen]` only for the four menu screens.
- The `bicycle` slice is implemented (`bicycle.byId` / `bicycle.allIds`, `addBicycle` / `updateBicycle` /
  `removeBicycle`, `hasBicycle`), documented in [docs/store/bicycle.md](../docs/store/bicycle.md).
- The `events` slice is a `ReservedSlice` placeholder (always `{}`): there is **no event data** to drive the card's
  icon row yet. Event icons are therefore deferred (design doc §8.1).
- Navigation is `activeScreen: ScreenView` (`'home' | 'addBicycle' | 'addComponent' | 'addClothesSet' |
  'beforeRideCheckIn'`), no router, and no notion of a selected entity.
- `@mui/material` is `^9.5.0`. `@mui/icons-material` is **not** installed; earlier designs avoided it on purpose
  (`MenuIcon`, `CloseIcon` are hand-made with `createSvgIcon`).
- There is no UI to add bicycles yet ("Add bicycle" is a placeholder), so the list is only visible with a seeded store
  (stories and tests).
- Highest ticket number used so far: 18 (batch #8), so this batch uses 19–21.

| Requirement | Ticket |
| --- | --- |
| Reusable list of cards, stacked vertically | #19 |
| Card wrapped in `Paper`; image left; name on row 1 | #19 |
| `DirectionsBike` from `@mui/icons-material` as the image | #19 |
| Selected bicycle in navigation state | #20 |
| Card clickable → Bicycle details screen | #21 |
| Bicycle details screen placeholder | #21 |
| Event icons on row 2 | #19 reserves the row; icons **deferred** to the `events` batch (design doc §8.1) |

Ruled out:

- **A router** (React Router, TanStack Router): one more screen does not justify it; `activeScreen` plus
  `selectedBicycleId` is enough until URLs are needed.
- **Reusing `VerticalList`** for cards: it renders `ListItemButton` text rows, not media cards; stretching its props
  would make both use cases worse.
- **MUI `Card` / `CardActionArea`**: the requirement asks for `Paper`; `Paper` + `ButtonBase` gives the same result with
  less markup.

### Workflow

> Default workflow for an agent picking up tickets from this batch. Adjust if the batch needs something different.
> Assumes a small project with a single developer: one ticket in progress at a time, no parallel ticket branches.

1. Pick the highest-priority ticket in the [Tickets](#tickets) table whose status is `Ready for Dev` and whose **Blocked by** tickets are all `Done`.
2. Set its status to `In Progress` in both the ticket file and the table.
3. Check out the batch branch `10-ui-introduce-bicycle-list` and pull it (see [Branching rules](#branching-rules)).
4. Implement the ticket in its owning layer (see `CLAUDE.md` → Code Ownership), add/update tests and stories.
5. Run verification locally — CI only runs on PRs to `master`, so the local run is the gate for ticket merges:
   `npm run typecheck`, `npm run lint`, the narrowest test lane, then `npm run test:all` if cross-cutting.
   Skip e2e (`npm run test:e2e*`) for now; it needs a Docker image to match the CI environment.
6. Run the `code-reviewer` subagent and address findings.
7. Commit on the batch branch as one commit per ticket: `<type>: #10 <description> (ticket <n>)`
   (e.g. `feat: #10 add reusable CardList and bicycle list on home (ticket 19)`), then set status to `Done` and unblock
   dependent tickets.
8. When every ticket is `Done`, open the batch → master PR and set **Batch status** to `In Review`.

Tickets are **vertical slices** where the size allows: #19 and #21 each deliver a user-visible behavior end to end
(component → `App` → stories/tests). The store work for the details screen is split out as #20 so that #21 stays
within size M (the tickets README asks to split anything L); #20 still ends in a testable behavior (selection and its
cleanup on removal). Inside a ticket, follow the `CLAUDE.md` order: store contract first, then components, then `App`.

### Branching rules

> **Changed from the README default:** this batch follows the convention of batches #6 and #8, with one batch
> branch named after the batch issue and no separate ticket branches. `CLAUDE.md` takes the commit's issue number from
> the branch name, so every commit uses `#10` and names its ticket in parentheses.

| Branch | Name | Created from | Merges into |
| --- | --- | --- | --- |
| Batch | `10-ui-introduce-bicycle-list` | `master`, after batch #8 merged | `master`, once per batch |

- Commit each ticket directly on the batch branch, one commit per ticket (plus plan/ticket status updates).
- Do not rebase or force-push the batch branch once it is pushed.

### Merge rules

- **Ticket commits:** exactly one commit per ticket on the batch branch: `<type>: #10 <description> (ticket <n>)`.
- **Batch → master:** open a PR from the batch branch to `master` (this is where CI runs) and merge with a
  **merge commit** (no squash, no rebase) so per-ticket commits stay in `master` history.
  - PR title / merge commit: `merge: #10 bicycle-card-list into master`.
  - PR description: link this plan and list the tickets included.
- **Syncing with master:** single-developer assumption — `master` rarely moves during a batch. If it does,
  merge `master` into the batch branch before starting the next ticket. Do not rebase the batch branch.
- **After the batch merges:** delete the batch branch and set **Batch status** to `Done`.

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- A ticket requires changing the Electron security posture (`contextIsolation`, `nodeIntegration`, `sandbox`).
- Acceptance criteria are ambiguous or contradict another ticket.
- A direct dependency upgrade or release is needed (`/npm-upgrade`, `/release-workflow` are user-invoked only).
- The batch branch is behind `master` and merging `master` into it produces conflicts.
- The current branch is not the batch branch recorded in the header.
- Installing `@mui/icons-material` (#19) would change any other dependency's version, needs a different major than
  `@mui/material`, or `npm install` reports new audit findings. Adding the package itself is approved by the batch
  requirements.

### Definition of done

> Applies to the batch as a whole. Each ticket also has its own Definition of Done (section 7 of the ticket template).

- [ ] All tickets in the table are `Done`, each as one commit on the batch branch
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally on the batch branch
- [ ] Batch → master PR is green in CI and merged with a merge commit
- [ ] Desktop and mobile stories exist for any changed UI
- [ ] Documentation updated where behavior changed ([docs/store/README.md](../docs/store/README.md) for the new UI
      state; the design doc status set to `Implemented`)
- [ ] With a seeded store, `home` shows one `Paper` card per bicycle in `allIds` order, and clicking a card shows that
      bicycle's details placeholder
- [ ] With an empty store, `home` is still blank, so the existing e2e visual baselines pass unchanged

### Tickets

> - One row per ticket. Ticket files live next to this plan as `tickets/<number>-<short-slug>.md`
>   and follow [docs/AgileTicketTemplate.md](../docs/AgileTicketTemplate.md).
> - Link the **Ticket** cell to the ticket file.
> - **Type:** Feature / Bug / Chore / Refactor / Test / Docs / Spike
> - **Priority:** P0 (critical) / P1 (high) / P2 (medium) / P3 (low)
> - **Size:** XS / S / M / L / XL
> - **Status:** Draft / Ready for Dev / In Progress / In Review / Done — must match the ticket file's header.
> - **Blocked by:** comma-separated ticket numbers, or `—` if none.

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#19](./19-bicycle-card-list-on-home.md) | Show bicycles as a card list on the home screen | Feature | P1 | M | Done | — |
| [#20](./20-store-selected-bicycle.md) | Track the selected bicycle in the store | Feature | P1 | S | Ready for Dev | — |
| [#21](./21-open-bicycle-details-from-card.md) | Open a Bicycle details placeholder from a card | Feature | P1 | M | Ready for Dev | 19, 20 |

### Expected end state

- With bicycles in the store, `home` shows a vertical stack of `Paper` cards: a rounded `DirectionsBike` avatar on the
  left, the bicycle name on row 1, and an empty row reserved for event icons on row 2. Clicking (or Enter/Space on) a
  card opens a placeholder screen titled with that bicycle's name. With no bicycles, `home` looks exactly as it does
  today.
- New code: `src/ui/components/CardList/` (reusable), `src/ui/components/screens/Home/` (with `BicycleAvatar`),
  `src/ui/components/screens/BicycleDetails/`; store additions `selectedBicycleId`, `openBicycleDetails`, and a
  `removeBicycle` wrapper in `useAppStore.ts`; translation key `home.bicycleList.label`.
- New dependency: `@mui/icons-material` (`^9`, matching `@mui/material`).
- Regression coverage: existing `App`, `AppMenu`, placeholder, and store tests; e2e layout and visual specs (unchanged
  baselines). New: `CardList`, `Home`, `BicycleDetails` unit tests and Desktop/Mobile/Dark stories; store tests for
  the selection; an `App` story and test for the home → details flow.
