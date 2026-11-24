# Plan: Component entity in the app store

> **Process:** follow [README.md](./README.md) for how plans and tickets are generated.
> **Batch branch:** `15-store-component-entity` (exists, created from `master` at `1a20ee9`)
> **Batch issue:** #15 (from the branch name; used in every commit message of this batch)
> **Batch status:** In Progress

## Goal

Replace the `components` placeholder in `useAppStore` with a working slice: the `BicycleComponent` entity, its
`history`, and validated actions to write both. Done when all tickets are `Done` and the checks in
[Definition of done](#definition-of-done) pass.

Design: [docs/store/components.md](../docs/store/components.md).

### Starting point

Verified on 2026-11-24 on branch `15-store-component-entity` (commit `1a20ee9`):

- `components` is a `ReservedSlice` (always `{}`). Only `src/store/constants.ts`, `src/store/types.ts`, and
  `src/store/__tests__/useAppStore.test.ts` refer to the key.
- The `bicycle` slice is the pattern to follow: `types.ts`, `constants.ts`, `createBicycleSlice.ts`, one function per
  file in `utilities/`, and tests in `__tests__/`.
- `ComponentId` already exists in `src/store/bicycle/types.ts`. `Bicycle.components` holds ids that nothing checks;
  bicycle tests use ids that do not exist (`'chain-1'`).
- Helpers the new slice needs live in the bicycle slice: `isIsoDate`, `definedChanges`, `CONTROL_CHARACTER_PATTERN`,
  `IsoDate`, and the file-private `checkText` (`validateBicycle.ts`) and `toOptionalText` (`normalizeBicycleInput.ts`).
- The store is not persisted, so entity shapes can grow from ticket to ticket without migrations.
- The `store` Vitest project runs `src/store/**/*.test.ts`. Coverage threshold for `src/store/**/*.ts`: 90% branches.
- **Add component** is a placeholder screen. No UI reads or writes components.
- Highest ticket number used so far: 21 (batch #10), so this batch uses 22–28.

| Requirement | Ticket |
| --- | --- |
| Entity with `id`, `type` (16 types), `model` | #22 |
| Edit and remove a component | #23 |
| `history` array; installed date; distance; record date (added on user request) | #24 |
| `position` (brakes, shifters, derailleur) | #25 |
| `subcomponent` (wheel, brakes, gear shifter) | #25 |
| Waxed/lubricated date and stretch (chain only) | #26 |
| Edit and remove a history entry | #27 |
| `Bicycle.components` refers to stored components ([store README §6](../docs/store/README.md#6-open-questions)) | #28 |

Ruled out:

- **Using the root `history` key** for component history: the request puts `history` on the entity.
- **A union type per component type**: see [components.md §6](../docs/store/components.md#6-decisions).
- **A validation library**: a new dependency for a few rules. The bicycle slice uses plain functions.
- **Persistence and UI**: out of scope. The **Add component** form is a later batch.

### Vertical slices

The batch is store-only, so a slice goes through every store layer rather than into the UI. Each ticket adds one thing
a caller can do through `useAppStore`, with its types, constants, normalization, validation, action, tests, and docs.
No ticket adds only types or only validators, and the app works after each one.

Helpers shared with the bicycle slice move to `src/store/common/` in the first ticket that needs them, not in a
separate refactoring ticket:

| Ticket | Moves from `src/store/bicycle/` to `src/store/common/` |
| --- | --- |
| #22 | `checkText`, `CONTROL_CHARACTER_PATTERN` |
| #23 | `definedChanges` (made generic) |
| #24 | `isIsoDate` and its test, `ISO_DATE_PATTERN`, `IsoDate`, `toOptionalText` |

A move must not change bicycle behavior. Existing bicycle test cases stay as they are, apart from import paths.

### Workflow

> **Changed from the README default:** same as batches #6, #8, and #10. One batch branch, no ticket branches, so a
> ticket goes from `In Progress` straight to `Done` with its commit. Plan and tickets are removed before the PR.

1. Pick the highest-priority ticket in the [Tickets](#tickets) table whose status is `Ready for Dev` and whose
   **Blocked by** tickets are all `Done`.
2. Set its status to `In Progress` in both the ticket file and the table.
3. Check out the batch branch and pull it.
4. Implement the ticket in `src/store/` and add or update tests (see the `zustand-unit-tests` skill).
5. Run verification locally: `npm run typecheck`, `npm run lint`, `npm run test:store`, then `npm run test:all`.
   Skip e2e (`npm run test:e2e*`); it needs the Docker image to match CI.
6. Run the `code-reviewer` subagent and address findings.
7. Commit on the batch branch as `<type>: #15 <description> (ticket <n>)`, one commit per ticket, including the status
   change to `Done`.
8. When every ticket is `Done`, remove `plan.md` and the ticket files, set the status line of
   [docs/store/components.md](../docs/store/components.md) to `Implemented (batch #15)`,
   remove the "in progress" notes on `components` from [docs/store/README.md](../docs/store/README.md), commit,
   and open the PR.

### Branching rules

| Branch | Name | Created from | Merges into |
| --- | --- | --- | --- |
| Batch | `15-store-component-entity` | `master` | `master`, once per batch |

- Commit each ticket directly on the batch branch.
- Do not rebase or force-push the batch branch.

### Merge rules

- **Batch → master:** open a PR (this is where CI runs) and merge with a **merge commit**, so per-ticket commits stay
  in `master` history. PR title: `merge: #15 store-component-entity into master`. The PR description lists the tickets
  included.
- **Syncing with master:** if `master` moves, merge it into the batch branch before starting the next ticket.
- **After the batch merges:** delete the batch branch.

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- A ticket requires changing the Electron security posture (`contextIsolation`, `nodeIntegration`, `sandbox`).
- Acceptance criteria are ambiguous or contradict another ticket or the store docs.
- A new npm dependency or a UI change would be needed.
- An existing bicycle test fails for a reason other than a moved import (#28 excepted, which changes seeded ids).
- The current branch is not the batch branch, or merging `master` into it produces conflicts.

### Definition of done

- [ ] All tickets in the table are `Done`, one commit each on the batch branch
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally
- [ ] `src/store/**` meets the 90% branch coverage threshold
- [ ] [docs/store/](../docs/store/) matches the code, and `components.md` is marked `Implemented`
- [ ] `plan.md` and ticket files removed
- [ ] Batch → master PR is green in CI and merged with a merge commit

### Tickets

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#22](./22-add-component.md) | Add a component to the store | Feature | P1 | M | Done | — |
| [#23](./23-edit-remove-component.md) | Edit and remove a component | Feature | P1 | S | Done | #22 |
| [#24](./24-record-component-install.md) | Record an installation and distance in component history | Feature | P1 | M | Done | #23 |
| [#25](./25-history-position-subcomponent.md) | Record position and subcomponent | Feature | P1 | M | Ready for Dev | #24 |
| [#26](./26-chain-care-history.md) | Record chain lubrication and stretch | Feature | P1 | S | Ready for Dev | #25 |
| [#27](./27-edit-remove-history-entry.md) | Edit and remove a history entry | Feature | P2 | S | Ready for Dev | #26 |
| [#28](./28-link-components-to-bicycles.md) | Keep bicycle component ids valid | Feature | P2 | S | Ready for Dev | #23 |

All open decisions are recorded in [components.md §6](../docs/store/components.md#6-decisions). By priority,
#28 comes after #26. It depends only on #23, so the user may ask for it earlier.

### Expected end state

- No user-visible change.
- New code: `src/store/components/` (types, constants, slice, utilities, tests) and `src/store/common/`. Changed:
  `src/store/{types,constants,useAppStore}.ts`, imports in `src/store/bicycle/`, and the bicycle component-id check.
- `events` and the root `history` stay placeholders.
- Existing bicycle, `App`, and store tests act as regression coverage. New store tests cover every rule and action in
  [components.md](../docs/store/components.md).
