# Plan: npm audit fixes after Node 24.22.3

> **Process:** follow [README.md](./README.md) for how plans and tickets are generated.
> **Dev branch:** `dev-20261117-npm-audit-fixes` (not created yet; create it from `master` once `1-initial-setup` is merged)
> **Batch issue:** #<TBD> — create the GitHub issue for this batch, then fill in the number here and in each ticket's **Epic** line.
> **Batch status:** Draft

## Goal

Clear the `npm audit` findings in the dev toolchain after the switch to Node 24.22.3, so the CI `Dependency audit` gate
(`npm run deps:audit:ci`, high level) passes on PRs to `master`.

### Starting point

- **Node:** pinned to 24.22.3 in `.nvmrc` and `package.json` → `engines.node` (`>=24.22.3`). CI workflows read
  `.nvmrc` through `node-version-file`. In Docker, only the **electron** e2e image is pinned
  (`NODE_VERSION=24.22.3` in `docker/e2e/Dockerfile` and `docker/e2e/compose.yml`). The **web** image uses whatever Node
  ships in `mcr.microsoft.com/playwright:v<PLAYWRIGHT_VERSION>-noble`, so `npm ci` there may print an `engines` warning.
  It does not fail, because `engine-strict` is not set.
- **`npm audit` (2026-11-17, npm 11.19.1):** 46 vulnerabilities (7 moderate, 39 high, 0 critical), all coming from three
  root advisories in **dev or build dependencies only**. `npm audit --omit=dev` reports 0. Confirmed against an
  installed `node_modules`: all 39 high findings come from `picomatch` (the only high root), and the 7 moderate ones come
  from `glob` and `minimatch`.

  | Root package | Advisory | Severity | Patched release? | Ticket |
  | --- | --- | --- | --- | --- |
  | `glob@13.0.7` | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | moderate | yes (`>=14.0.2`, or remove via docgen plugin 0.9.x) | #2 |
  | `minimatch@9.0.9`, `@10.2.6` | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | moderate | yes (`>=11.0.1`, major for consumers) | #3 |
  | `picomatch@4.0.7` | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) | high | **no**: 4.0.7 is latest | #4 |

- Every direct dependency is already on its latest version, so there is no plain `npm upgrade` to run. The `fixAvailable`
  versions npm suggests (`vite@6.2.7`, `vitest@3.1.4`, `electron-builder@25.1.0`, `@storybook/react-vite@8.5.3`, …) are
  **downgrades**, so never run `npm audit fix --force`. A non-forced `npm audit fix` rewrites the lockfile and fixes nothing.
- Fixes therefore use scoped `overrides` in `package.json` plus a lockfile refresh. No `src/**` or `electron/**` code changes
  are expected.

### Workflow

> Default workflow for an agent picking up tickets from this batch. Adjust if the batch needs something different.
> Assumes a small project with a single developer: one ticket in progress at a time, no parallel ticket branches.

0. Before the first ticket starts, run `npm view picomatch version`. If it is still `4.0.7`, ask the user for the #4
   Story 2 decision up front. #4 is first in priority order and cannot be finished without it.
1. Pick the highest-priority ticket in the [Tickets](#tickets) table whose status is `Ready for Dev` and whose **Blocked by** tickets are all `Done`.
2. Set its status to `In Progress` in both the ticket file and the table.
3. Check out the dev branch, pull it, and create the ticket branch from it (see [Branching rules](#branching-rules)).
4. Implement the ticket in its owning layer (see `CLAUDE.md` → Code Ownership), add/update tests and stories.
5. Run verification locally — CI only runs on PRs to `master`, so the local run is the gate for ticket merges:
   `npm run typecheck`, `npm run lint`, the narrowest test lane, then `npm run test:all` if cross-cutting.
   Skip e2e (`npm run test:e2e*`) for now; it needs a Docker image to match the CI environment.
6. Run the `code-reviewer` subagent and address findings.
7. Commit using `<type>: #<ticket> <description>`, then set status to `In Review`.
8. Merge into the dev branch (see [Merge rules](#merge-rules)), set status to `Done`, and unblock dependent tickets.
9. When every ticket is `Done`, open the dev → master PR and set **Batch status** to `In Review`.

### Branching rules

| Branch | Name | Created from | Merges into |
| --- | --- | --- | --- |
| Dev (batch bucket) | `dev-<yyyymmdd>-<batch-slug>` | `master`, when the batch starts | `master`, once per batch |
| Ticket | `<ticket-number>-<short-slug>` (e.g. `142-add-settings-overlay`) | the dev branch | the dev branch |

- Use the date the batch starts, in `yyyymmdd` format, plus a short kebab-case slug of the batch goal.
- Use a hyphen, not a slash (`dev-...`, never `dev/...`) — git cannot hold both a `dev` branch and `dev/*` branches.
- Never branch a ticket from `master` or from another ticket branch.
- Never commit directly to the dev branch except for plan/ticket status updates and syncing with `master`.
- Record the dev branch name in the header of this plan before the first ticket starts.

### Merge rules

- **Ticket → dev:** squash-merge, so the dev branch has exactly one commit per ticket:
  `<type>: #<ticket> <description>`. Delete the ticket branch afterwards.
- **Dev → master:** open a PR from the dev branch to `master` (this is where CI runs) and merge with a
  **merge commit** (no squash, no rebase) so per-ticket commits stay in `master` history.
  - PR title / merge commit: `merge: #<batch-issue> <batch-slug> into master`
    (e.g. `merge: #150 settings-overlay into master`).
  - PR description: link this plan and list the tickets included.
- **Syncing with master:** single-developer assumption — `master` rarely moves during a batch. If it does,
  merge `master` into the dev branch before starting the next ticket. Do not rebase the dev branch.
- **After the batch merges:** delete the dev branch and set **Batch status** to `Done`.

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- A ticket requires changing the Electron security posture (`contextIsolation`, `nodeIntegration`, `sandbox`).
- Acceptance criteria are ambiguous or contradict another ticket.
- A direct dependency upgrade or release is needed (`/npm-upgrade`, `/release-workflow` are user-invoked only).
  Scoped `overrides` for transitive packages are in scope.
- An override breaks a consumer (build, packaging, Storybook, type-coverage) and can't be fixed within the ticket.
- No patched `picomatch` exists when #4 starts, so the interim CI audit policy is the user's decision. Ask at batch
  start (Workflow step 0), not mid-batch.
- `1-initial-setup` is not merged into `master` yet. Do not create the dev branch from a `master` that lacks it.
- The dev branch is behind `master` and merging `master` into it produces conflicts.
- No dev branch is recorded in the header, or the recorded branch does not exist.

### Definition of done

> Applies to the batch as a whole. Each ticket also has its own Definition of Done (section 7 of the ticket template).

- [ ] All tickets in the table are `Done` and squash-merged into the dev branch
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally on the dev branch
- [ ] Dev → master PR is green in CI and merged with a merge commit
- [ ] Desktop and mobile stories exist for any changed UI
- [ ] Documentation updated where behavior changed
- [ ] `npm audit` lists no `glob` or `minimatch` advisories, and `picomatch` is either patched or covered by the documented #4 decision
- [ ] `npm run deps:audit:ci` passes locally and in CI
- [ ] `npm run build:e2e` still packages the Electron app with the expected `build.files` contents

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
| [#4](./4-picomatch-redos-audit-gate.md) | Resolve picomatch ReDoS advisory and unblock the CI audit gate | Spike | P0 | XS | Draft | — |
| [#2](./2-remove-vulnerable-glob.md) | Remove vulnerable glob 13 from the Storybook docgen chain | Chore | P1 | S | Done | — |
| [#3](./3-override-vulnerable-minimatch.md) | Override transitive minimatch 9.x/10.x to a patched 11.x | Chore | P1 | S | Draft | 2 |

### Expected end state

- No user-visible change. The shipped web and Electron app is the same, because runtime dependencies were already clean.
- `package.json` has a scoped `overrides` block: the docgen plugin under `@storybook/react-vite` (#2), and `minimatch@^11.0.1`
  under `app-builder-lib`, `@electron/universal` and `type-coverage-core` (#3). npm `overrides` cannot hold comments, so
  removal conditions are tracked in [Override removal](#override-removal) below.

### Override removal

| Override (in `package.json` → `overrides`) | Added by | Remove when |
| --- | --- | --- |
| `@storybook/react-vite` → `@joshwooding/vite-plugin-react-docgen-typescript: ^0.9.1` | [#2](./2-remove-vulnerable-glob.md) | `@storybook/react-vite` depends on the plugin `>=0.9.0` (10.6.7 still requires `^0.7.0`) |
- `npm audit` shows no `glob` or `minimatch` findings. `picomatch` is either patched (lockfile refresh) or explicitly handled
  by the CI audit policy chosen in #4.
- The CI `Dependency audit` step passes, and the dev → master PR is green.
- No new tests or stories. The existing `test:all`, `test:storybook`, `types:coverage` and `build:e2e` act as regression checks.

