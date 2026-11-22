# Plan: App store and bicycle entity

> **Process:** follow [README.md](./README.md) for how plans and tickets are generated.
> **Dev branch:** `8-store-bicycle-entity` (exists; all work is committed on this branch, see [Workflow](#workflow))
> **Batch issue:** #8
> **Batch status:** In Progress
> **Design:** [docs/store/README.md](../docs/store/README.md), [docs/store/bicycle.md](../docs/store/bicycle.md)

## Goal

Lay out the domain part of the app store (root keys `bicycle`, `events`, `components`, `history`) and implement the
`bicycle` slice: the `Bicycle` entity, input normalization and validation, and add/update/remove actions. Done when
every ticket below is `Done` and `npm run typecheck`, `npm run lint`, and `npm run test:all` pass.

### Starting point

Verified on 2026-11-21 on branch `8-store-bicycle-entity` (at `63d1315`):

- Zustand `^5.0.16`, Vitest 5. `src/store/` has one store, `useAppStore`, with UI state only (`isMenuOpen`,
  `activeScreen`) and five actions (`openMenu`, `closeMenu`, `toggleMenu`, `navigateTo`, `reset`).
- `INITIAL_APP_STATE` is spread by `App.stories.tsx` and `App.test.tsx` (`setState({ ...INITIAL_APP_STATE })`), so
  new root keys reach them without changes. `useAppStore.test.ts` asserts `INITIAL_APP_STATE` with `toEqual` and needs
  an update.
- The `store` Vitest project runs `src/store/**/*.test.ts`. Coverage threshold for `src/store/**/*.ts`: 90% branches.
- `src/shared/` does not exist. Nothing outside the store needs the bicycle types yet, so they stay in `src/store/`.
- No UI reads or writes bicycles yet. The **Add bicycle** screen is a placeholder.

Ruled out:

- A second store for domain data: `CLAUDE.md` requires a single global store.
- Moving the UI fields under a `ui` key: not needed for this goal, and it would touch `App`, stories, and tests.
- Persistence (`persist` middleware): out of scope; see [docs/store/README.md §4](../docs/store/README.md#4-persistence).
- A validation library (zod, etc.): a new dependency for seven fields. Plain functions are enough.

### Workflow

> Changed from the default: the user asked for everything to be committed on the current branch, so there is no
> separate dev branch, no ticket branches, and no squash merges. Everything else is the default.

1. Pick the highest-priority ticket in the [Tickets](#tickets) table whose status is `Ready for Dev` and whose **Blocked by** tickets are all `Done`.
2. Set its status to `In Progress` in both the ticket file and the table.
3. Implement the ticket in its owning layer (see `CLAUDE.md` → Code Ownership) and add/update tests.
4. Run verification locally: `npm run typecheck`, `npm run lint`, `npm run test:store`, then `npm run test:all`.
   Skip e2e (`npm run test:e2e*`); it needs the Docker image to match CI.
5. Run the `code-reviewer` subagent and address findings.
6. Commit on `8-store-bicycle-entity` as `<type>: #8 <description> (ticket <n>)` (one commit per ticket) and set
   status to `Done`.
7. When every ticket is `Done`, remove `plan.md` and the ticket files, mark the store docs `Implemented`, and commit.

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- A ticket requires changing the Electron security posture (`contextIsolation`, `nodeIntegration`, `sandbox`).
- Acceptance criteria are ambiguous or contradict another ticket or the store docs.
- A new npm dependency would be needed.
- A ticket would require a UI change (no UI is in scope for this batch).

### Definition of done

- [ ] All tickets in the table are `Done` and committed on the branch
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally
- [ ] Store docs in `docs/store/` match the code and are marked `Implemented`
- [ ] `plan.md` and ticket files removed once implementation is finished

### Tickets

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#16](./16-store-root-structure.md) | Add domain root keys (`bicycle`, `events`, `components`, `history`) to `useAppStore` | Feature | P1 | S | Done | — |
| [#17](./17-bicycle-validation.md) | Add bicycle input normalization and validation utilities | Feature | P1 | S | Done | #16 |
| [#18](./18-bicycle-actions.md) | Add `addBicycle`, `updateBicycle`, `removeBicycle` store actions | Feature | P1 | S | Done | #16, #17 |

### Expected end state

- No user-visible change.
- New code: `src/store/bicycle/{types,constants,createBicycleSlice}.ts`, `src/store/bicycle/utilities/*.ts`, and
  tests under `src/store/bicycle/__tests__/`. Changed: `src/store/{types,constants,useAppStore}.ts` and
  `src/store/__tests__/useAppStore.test.ts`.
- New docs: `docs/store/README.md`, `docs/store/bicycle.md`.
- Existing `App` tests and stories act as regression coverage for the UI state. New store unit tests cover the root
  shape, every validation rule, and every action.
