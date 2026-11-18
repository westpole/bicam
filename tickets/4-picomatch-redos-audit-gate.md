# [SPIKE] Resolve picomatch ReDoS advisory and unblock the CI audit gate

> **Ticket type:** Spike
> **Status:** Done
> **Priority:** P0
> **Epic:** [npm audit remediation batch](./plan.md) — batch issue #<TBD>
> **Sprint:** `dev-20261117-npm-audit-fixes`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** XS

---

## 1. Summary

`picomatch@4.0.7` is affected by [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
(**high**, ReDoS via single-branch repeated extglobs, affects `<=4.0.7`). As of 2026-11-17 **no patched release exists**:
4.0.7 is `latest`. CI runs `npm run deps:audit:ci` on every PR to `master`. When this ticket was written it was
`npm audit --audit-level=high` (since changed, see Outcome), so every PR, including this batch's dev → master PR, would
fail until this was resolved.

> **User decision required.** Unless a patched picomatch has shipped, this ticket cannot be finished without the user's
> choice in Story 2. Get that decision when the batch starts (see the plan Workflow), so the batch does not stall here.

---

## 2. Problem / Opportunity

- **Problem statement:** `picomatch` is the only high-severity root advisory, so all 39 high findings come from it.
  It is used by `vite`, `vitest`, `tinyglobby`, `fdir`, `knip`, `unplugin`, `vite-plugin-singlefile`, `@vitejs/plugin-react`, the `@vitest/*` packages,
  `@storybook/addon-docs`, `@storybook/addon-vitest`, `typescript-eslint` and `@eslint-react/*`. All of these are on their
  latest versions. npm's suggested fixes (`vite@6.2.7`, `vitest@3.1.4`, `knip@3.13.2`, `typescript-eslint@8.47.0`, …)
  are **downgrades**. Do not apply them.
- **Evidence:**
  - `npm audit --omit=dev` → **0 vulnerabilities**. Every affected package is a dev or build dependency, so the shipped
    web and Electron app does not include it.
  - picomatch only processes glob patterns written in repo config (Vite, Vitest, knip, ESLint). Untrusted input never
    reaches it, so the realistic ReDoS exposure is negligible.
- **Success metric(s):** the CI `Dependency audit` step passes on PRs to `master`, and no real exposure is left
  unaccepted or undocumented.

---

## 3. User Stories

### Story 1: Apply the upstream fix if it has shipped
**As a** maintainer
**I want to** move to a patched picomatch as soon as one exists
**So that** the advisory is fixed rather than tolerated

**Acceptance Criteria:**
- [ ] Given `npm view picomatch version`, when it returns a version that the advisory lists as patched (`>4.0.7`),
      then `npm update picomatch` (or a lockfile refresh) moves every copy to it, and `npm audit` no longer lists
      `picomatch` or its dependents. *(n/a: on 2026-11-17 `npm view picomatch version` returned `4.0.7`, still `latest`.
      Story 2 applies.)*
- [ ] Given the updated lockfile, when `npm run typecheck`, `npm run lint` and `npm run test:all` run, then all pass.
      *(n/a: Story 1 did not apply.)*

**Out of scope:** upgrading `vite`, `vitest`, `knip` or other direct dependencies (`/npm-upgrade` is user-invoked only).

### Story 2: Decide the interim CI policy if no fix exists
**As a** maintainer
**I want to** have an explicit, documented decision on the audit gate
**So that** PRs are not blocked indefinitely by a dev-only advisory with no fix

**Acceptance Criteria:**
- [x] Given no patched picomatch, when this story starts, then the agent **stops and asks** the user to choose (see the
      plan Exceptions). *(Asked on 2026-11-17. The user chose option 1.)* Options to present:
  1. Gate CI on runtime dependencies only: `deps:audit:ci` → `npm audit --omit=dev --audit-level=high`, and keep the full
     `npm run deps:audit` as an informational, non-failing step.
  2. Keep the full gate and add a time-boxed allowlist for `GHSA-fc5q-39xc-vjpf` (for example with an audit-allowlist
     tool; this needs a new devDependency, so `/npm-upgrade`).
  3. Keep the gate as-is and hold the dev → master PR until upstream ships a fix.
- [x] Given the chosen option, when it is implemented, then the decision, the advisory ID and a "remove when picomatch > 4.0.7
      ships" note are recorded in this ticket and in a comment next to the CI step in `.github/workflows/pr-tests-runner.yml`.

**Out of scope:** changing other CI steps.

---

## 4. Design & Reference Assets

No UI change.

---

## 5. Technical Notes / Implementation Guidance

- **Affected files:** `package-lock.json` (Story 1). For Story 2, possibly `package.json` (`deps:audit:ci`) and
  `.github/workflows/pr-tests-runner.yml`.
- **Owning layer:** tooling or CI only.
- **Test lane:** `npm run test:all`, and run `npm run deps:audit:ci` locally to confirm the gate result.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** — (blocks the batch's dev → master PR passing CI)
- **Risks/open questions:**
  - Option 1 stops CI from failing on high advisories in dev tooling. Supply-chain risk in dev dependencies then depends on
    running `npm run deps:audit` regularly. Decision owner: Stanislav Spuzyak.

---

## 7. Definition of Done

- [x] Story 1 or Story 2 completed, with the outcome recorded in this ticket
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass locally
      *(`typecheck` and `lint` pass. `test:all` has the same 3 failures recorded in #3's Outcome, which happen without
      this batch's changes.)*
- [x] `npm run deps:audit:ci` passes locally, or Story 2 option 3 (hold the PR) was chosen and is recorded in this ticket
- [x] `code-reviewer` subagent run and findings addressed
- [ ] Squash-merged into `dev-20261117-npm-audit-fixes` as `chore: #4 <resolve picomatch advisory | adjust audit gate>`
      *(Not applicable: at the user's direction this ticket is committed directly on `1-initial-setup`. The dev branch
      does not exist yet.)*

### Outcome (2026-11-17)

- **Decision (user, 2026-11-17):** Story 2, option 1. The CI gate covers runtime dependencies only, while advisory
  [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) (`picomatch <=4.0.7`) has no patched release.
- **Changes:**
  - `package.json`: `deps:audit:ci` is now `npm audit --omit=dev --audit-level=high` (was `npm audit --audit-level=high`).
    `deps:audit` (the full audit) is unchanged.
  - `.github/workflows/pr-tests-runner.yml`:
    - The `Dependency audit` step has a comment with the advisory ID, the reason, and the steps to undo it.
    - A new `Dependency audit (full, informational)` step runs `npm run deps:audit` with `continue-on-error: true`, so
      dev-dependency findings stay visible in the CI log.
  - `.claude/skills/npm-upgrade/SKILL.md` step 6 now says `deps:audit:ci` covers runtime dependencies only. For dev
    dependency upgrades it points to `npm run deps:audit` against a baseline.
- **Local results:**
  - `npm run deps:audit:ci`: 0 vulnerabilities, exit 0.
  - `npm run deps:audit`: 43 high, all from `picomatch`, exit 1. The CI step tolerates this.
  - The workflow YAML parses, and the new step has `continue-on-error: true`.
- **Remove when `picomatch > 4.0.7` ships:**
  1. Refresh the lockfile so every copy moves to the patched version (Story 1).
  2. Drop `--omit=dev` from `deps:audit:ci`.
  3. Delete the informational CI step and the interim comment.
  This is also tracked in the plan's [Override removal](./plan.md#override-removal) table.
- **Accepted policy gap:** `--omit=dev` hides **every** dev-dependency advisory, not only `picomatch`. That includes
  `vite`, `electron-builder` and `electron` itself, which build the shipped web bundle and Windows app but are
  devDependencies. Until the full gate is restored, the informational CI step (or a local `npm run deps:audit`) is the only
  place a new high advisory in that toolchain shows up. Check it on dependency-related PRs.
- **Note:** `continue-on-error` reports the step as passed even when the full audit finds something. Check the step's log,
  or run `npm run deps:audit` locally, to see dev-dependency findings.
- **CI caveat:** the dev → master PR will still be red on `Run all unit/component tests` until the 3 failing tests
  (see #3's Outcome) are fixed. That is outside this ticket.

---

## 8. Links

- Parent batch: [tickets/plan.md](./plan.md)
- Related tickets: [#2](./2-remove-vulnerable-glob.md), [#3](./3-override-vulnerable-minimatch.md)
- Advisory: https://github.com/advisories/GHSA-fc5q-39xc-vjpf
