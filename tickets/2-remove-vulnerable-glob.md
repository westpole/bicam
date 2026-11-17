# [CHORE] Remove vulnerable glob 13 from the Storybook docgen chain

> **Ticket type:** Chore
> **Status:** Draft
> **Priority:** P1
> **Epic:** [npm audit remediation batch](./plan.md) — batch issue #<TBD>
> **Sprint:** `dev-20261117-npm-audit-fixes`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Get rid of `glob@13.0.7` in the dev dependency tree. It is affected by
[GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) (moderate: AbortSignal cancellation bypass,
affects `glob >=9.0.0 <=14.0.1`). The upgrade should leave Storybook working as it does today.

---

## 2. Problem / Opportunity

- **Problem statement:** `npm audit` (run on 2026-11-17, Node 24.22.3 / npm 11.19.1) reports `glob` as a root advisory.
  That one advisory is why `@storybook/react-vite`, `@joshwooding/vite-plugin-react-docgen-typescript` and `@rollup/pluginutils`
  show up as vulnerable.
- **Evidence:**
  - Dependency chain: `@storybook/react-vite@10.6.7` (latest) → `@joshwooding/vite-plugin-react-docgen-typescript@^0.7.0`
    (locked 0.7.0) → `glob@^13.0.1` (locked 13.0.7, and 13.0.7 is the last 13.x release). `glob@13` in turn pulls in
    `minimatch@10.2.6`, which is also vulnerable (see #3).
  - `@joshwooding/vite-plugin-react-docgen-typescript@0.9.1` (latest) no longer depends on `glob`. It uses `tinyglobby`.
  - npm's suggested fix (`@storybook/react-vite@8.5.3`) is a **downgrade**. Do not apply it.
- **Success metric(s):** `npm audit` no longer lists `glob`, and no longer lists `@storybook/react-vite` because of `glob`.

---

## 3. User Stories

### Story 1: Patch the docgen plugin through an npm override
**As a** maintainer
**I want to** have Storybook's react-docgen plugin resolve to a version without `glob@13`
**So that** the dev toolchain has no known `glob` advisory

**Acceptance Criteria:**
- [ ] Given `package.json`, when the fix is applied, then an `overrides` entry is scoped to `@storybook/react-vite` and pins
      `@joshwooding/vite-plugin-react-docgen-typescript` to `^0.9.1`.
      Fallback if 0.9.x is incompatible: scope a `glob` override `>=14.0.2` to the plugin instead.
- [ ] Given a clean install (`rm -rf node_modules && npm install`), when `npm ls glob --all` runs, then no `glob` in
      `>=9.0.0 <=14.0.1` remains.
- [ ] Given the updated lockfile, when `npm audit` runs, then `glob` and `@joshwooding/vite-plugin-react-docgen-typescript`
      are no longer listed.
- [ ] Given Storybook, when `npm run test:storybook` and `npm run build-storybook` run, then both succeed and the autodocs
      prop tables still render component props (spot check one component's Docs page in `npm run storybook`).
- [ ] Edge case: if Storybook releases a version that already depends on the fixed plugin, upgrade Storybook instead of adding
      the override. Upgrades go through `/npm-upgrade`, so stop and ask before running one.

**Out of scope:** the `minimatch` advisory (#3), the `picomatch` advisory (#4), and any Storybook major or minor upgrade.

---

## 4. Design & Reference Assets

No UI change. Existing stories under `src/ui/components/**` are the regression surface.

---

## 5. Technical Notes / Implementation Guidance

- **Affected files:** `package.json` (`overrides`), `package-lock.json`.
- **Owning layer:** tooling or build only. No `src/**` or `electron/**` changes are expected.
- **Test lane:** `npm run test:storybook`, plus `npm run typecheck` and `npm run lint`.
- `node_modules` must be reinstalled under Node 24.22.3 before verifying.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** 3 (removing `glob@13` also removes one `minimatch@10` path)
- **Risks/open questions:**
  - Plugin 0.7 → 0.9 is a 0.x minor jump, so its options or behavior may differ from what Storybook 10.6 expects.
    Verify the docs prop tables.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:storybook` pass locally
- [ ] `code-reviewer` subagent run and findings addressed
- [ ] Squash-merged into `dev-20261117-npm-audit-fixes` as `chore: #2 remove vulnerable glob from storybook docgen`

---

## 8. Links

- Parent batch: [tickets/plan.md](./plan.md)
- Related tickets: [#3](./3-override-vulnerable-minimatch.md), [#4](./4-picomatch-redos-audit-gate.md)
- Advisory: https://github.com/advisories/GHSA-3g3m-2fjr-6pw4
