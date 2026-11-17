# [SPIKE] Resolve picomatch ReDoS advisory and unblock the CI audit gate

> **Ticket type:** Spike
> **Status:** Draft
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
4.0.7 is `latest`. CI runs `npm run deps:audit:ci` (`npm audit --audit-level=high`) on every PR to `master`, so every
PR, including this batch's dev → master PR, will fail until this is resolved.

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
      `picomatch` or its dependents.
- [ ] Given the updated lockfile, when `npm run typecheck`, `npm run lint` and `npm run test:all` run, then all pass.

**Out of scope:** upgrading `vite`, `vitest`, `knip` or other direct dependencies (`/npm-upgrade` is user-invoked only).

### Story 2: Decide the interim CI policy if no fix exists
**As a** maintainer
**I want to** have an explicit, documented decision on the audit gate
**So that** PRs are not blocked indefinitely by a dev-only advisory with no fix

**Acceptance Criteria:**
- [ ] Given no patched picomatch, when this story starts, then the agent **stops and asks** the user to choose (see the
      plan Exceptions). Options to present:
  1. Gate CI on runtime dependencies only: `deps:audit:ci` → `npm audit --omit=dev --audit-level=high`, and keep the full
     `npm run deps:audit` as an informational, non-failing step.
  2. Keep the full gate and add a time-boxed allowlist for `GHSA-fc5q-39xc-vjpf` (for example with an audit-allowlist
     tool; this needs a new devDependency, so `/npm-upgrade`).
  3. Keep the gate as-is and hold the dev → master PR until upstream ships a fix.
- [ ] Given the chosen option, when it is implemented, then the decision, the advisory ID and a "remove when picomatch > 4.0.7
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

- [ ] Story 1 or Story 2 completed, with the outcome recorded in this ticket
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass locally
- [ ] `npm run deps:audit:ci` passes locally, or Story 2 option 3 (hold the PR) was chosen and is recorded in this ticket
- [ ] `code-reviewer` subagent run and findings addressed
- [ ] Squash-merged into `dev-20261117-npm-audit-fixes` as `chore: #4 <resolve picomatch advisory | adjust audit gate>`

---

## 8. Links

- Parent batch: [tickets/plan.md](./plan.md)
- Related tickets: [#2](./2-remove-vulnerable-glob.md), [#3](./3-override-vulnerable-minimatch.md)
- Advisory: https://github.com/advisories/GHSA-fc5q-39xc-vjpf
