# Tickets: how to generate a plan and tickets

This folder holds the plan for the current batch of work and its ticket files. Agents use this README as the process
and template guide when asked to turn a goal into a plan and tickets.

| File | Purpose |
| --- | --- |
| `README.md` | This guide. It is generic and does not change per batch. |
| `plan.md` | The current batch plan: goal, starting point, workflow, rules, ticket table, expected end state. |
| `<number>-<short-slug>.md` | One file per ticket, based on [docs/AgileTicketTemplate.md](../docs/AgileTicketTemplate.md). |

Only one batch is active at a time. When a batch is `Done` and merged, delete or archive its `plan.md` and ticket files
before generating the next batch.

---

## Generation steps

1. **Research the starting point.** Read the code, configs, and tool output that the goal touches. Record facts with
   dates and versions (for example `npm audit` output, current dependency versions). Separate verified facts from
   assumptions.
2. **Split the goal into tickets.** Each ticket should be independently mergeable, owned by one layer where possible
   (see `CLAUDE.md` → Code Ownership), and small enough to review in one sitting (target XS–M; split anything L or XL).
3. **Number the tickets.** Use the GitHub issue number when one exists. Otherwise take the next free number after the
   highest number used in branches, commits, and existing tickets.
4. **Order by priority and dependencies.** Fill in **Blocked by** / **Blocks** so they agree between the plan table and
   the ticket files. Avoid dependency cycles.
5. **Write `plan.md`** from the [plan template](#plan-template) below.
6. **Write each ticket file** from the ticket template, following the [ticket guidance](#ticket-file-guidance).
7. **Cross-check.** Status, priority, size, and dependencies match between `plan.md` and every ticket file. Every
   ticket's **Epic** links to `plan.md`. Every link resolves.
8. **Set statuses.** New plans start as `Draft`. Mark tickets `Ready for Dev` only when their acceptance criteria are
   unambiguous. Leave anything that needs a user decision as `Draft` and list the open question.
9. **Stop and report.** Generating a plan does not start implementation. Summarize the tickets and open questions for
   the user.

---

## Plan template

Copy the block below into `tickets/plan.md` and replace every `<placeholder>`. Keep the default **Workflow**,
**Branching rules**, and **Merge rules** unless the batch needs something different, and say so when you change them.

````markdown
# Plan: <batch goal in a few words>

> **Process:** follow [README.md](./README.md) for how plans and tickets are generated.
> **Dev branch:** `dev-<yyyymmdd>-<batch-slug>` (<created / not created yet, and from what>)
> **Batch issue:** #<TBD> — create the GitHub issue for this batch, then fill in the number here and in each ticket's **Epic** line.
> **Batch status:** Draft

## Goal

<One or two sentences: what changes and how we know it is done (for example, a CI gate that must pass).>

### Starting point

- <Verified facts about the current state, with dates and tool versions.>
- <Tables of findings, each row mapped to the ticket that addresses it.>
- <Constraints and approaches that are ruled out, and why.>

### Workflow

> Default workflow for an agent picking up tickets from this batch. Adjust if the batch needs something different.
> Assumes a small project with a single developer: one ticket in progress at a time, no parallel ticket branches.

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
- The dev branch is behind `master` and merging `master` into it produces conflicts.
- No dev branch is recorded in the header, or the recorded branch does not exist.
- <Batch-specific cases: decisions that belong to the user, prerequisites that must be merged first.>

### Definition of done

> Applies to the batch as a whole. Each ticket also has its own Definition of Done (section 7 of the ticket template).

- [ ] All tickets in the table are `Done` and squash-merged into the dev branch
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally on the dev branch
- [ ] Dev → master PR is green in CI and merged with a merge commit
- [ ] Desktop and mobile stories exist for any changed UI
- [ ] Documentation updated where behavior changed
- [ ] <Batch-specific checks that prove the goal is met.>

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
| [#<n>](./<n>-<short-slug>.md) | <title> | <type> | <priority> | <size> | Draft | — |

### Expected end state

- <User-visible changes, or "No user-visible change".>
- <Config, code, and docs that will exist when the batch is done.>
- <Which existing checks act as regression coverage, and which new tests or stories are added.>
````

---

## Ticket file guidance

Copy [docs/AgileTicketTemplate.md](../docs/AgileTicketTemplate.md) into `tickets/<number>-<short-slug>.md` for each
ticket, then:

- **Title:** replace `[FEATURE]` with the ticket type (`[BUG]`, `[CHORE]`, …) when it is not a feature.
- **Header fields:** `Status`, `Priority`, and `Estimate` must match the row in the plan's ticket table.
- **Epic:** link back to [plan.md](./plan.md) and the batch issue.
- **Sprint:** the dev branch name.
- **User stories:** keep each story independently testable; always fill in **Out of scope**.
- **Design & reference assets:** prefer repo paths (`docs/assets/...`) or existing components/stories under `src/ui/components/**`, with a text fallback for every visual.
- **Technical notes:** name the owning layer (React/MUI UI in `src/ui/**`, Zustand store in `src/store/**`, translations in `src/i18n/**`, Electron in `electron/**`) and which test lane covers it.
- **Dependencies:** `Blocked by` / `Blocks` must match the plan's ticket table.
- **Definition of done:** drop items that do not apply (e.g. analytics, PM sign-off) rather than leaving them unchecked.
