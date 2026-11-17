# [CHORE] Override transitive minimatch 9.x/10.x to a patched 11.x

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

Move every vulnerable transitive `minimatch` (affected range `>=7.0.0 <11.0.1`,
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderate DoS) to `minimatch@^11.0.1`.
Use scoped npm overrides, and confirm that the Electron packaging and type-coverage tooling still work.

---

## 2. Problem / Opportunity

- **Problem statement:** `npm audit` (2026-11-17) flags `minimatch`. That flag is why `electron-builder`, `app-builder-lib`,
  `@electron/universal`, `@electron/rebuild`, `dmg-builder`, `electron-builder-squirrel-windows` and `node-gyp` appear as
  vulnerable. Every parent is already on its latest release, so no plain upgrade fixes it. npm proposes
  `electron-builder@25.1.0`, which is a **downgrade**. Do not apply it.
- **Evidence:** vulnerable copies in `package-lock.json`:

  | Copy | Required by | Range |
  | --- | --- | --- |
  | `minimatch@9.0.9` | `@electron/universal@2.0.3` (pinned exactly by `app-builder-lib@26.18.0`) | `^9.0.3` |
  | `minimatch@10.2.6` | `app-builder-lib@26.18.0` | `^10.2.5` |
  | `minimatch@10.2.6` | `glob@13.0.7` (removed by #2) | `^10.2.2` |
  | `minimatch@10.2.6` | `type-coverage-core@2.31.2` | `6 \|\| 7 \|\| 8 \|\| 9 \|\| 10` |

  The 9.x line ends at 9.0.9 and the 10.x line ends at 10.2.6, and both are still affected, so `^11.0.1` is the only fix.
  `minimatch@3.x` and `minimatch@5.x` copies are outside the affected range and need no change.
  The top-level `node_modules/minimatch` is already `11.0.9` and is used by `eslint`, `@eslint/config-array` and
  `@typescript-eslint/typescript-estree`, so 11.x already works inside this toolchain.
- **Success metric(s):** `npm audit` no longer lists `minimatch` or the electron-builder chain.

---

## 3. User Stories

### Story 1: Scoped minimatch overrides
**As a** maintainer
**I want to** force the affected parents onto `minimatch@^11.0.1`
**So that** the dev toolchain has no known `minimatch` advisory

**Acceptance Criteria:**
- [ ] Given `package.json`, when the fix is applied, then the `overrides` entries are **scoped** to the affected parents
      (`app-builder-lib`, `@electron/universal`, `type-coverage-core`, and `glob` only if #2 did not remove it).
      There is no global `minimatch` override, which would also break the `^3` and `^5` consumers.
- [ ] Given #2 used its fallback (a `glob >=14.0.2` override instead of removing glob), when `npm ls minimatch --all`
      runs, then check the `minimatch` copy under the overridden `glob`. If it is in `>=7.0.0 <11.0.1`, add a scoped
      `minimatch@^11.0.1` override under that `glob` entry. If glob 14 already brings a patched minimatch, record that
      here and add nothing.
- [ ] Given a clean install, when `npm ls minimatch --all` runs, then no copy is in `>=7.0.0 <11.0.1`.
- [ ] Given the updated lockfile, when `npm audit` runs, then `minimatch`, `electron-builder`, `app-builder-lib`,
      `@electron/universal`, `@electron/rebuild` and `node-gyp` are no longer listed.

**Out of scope:** upgrading `electron-builder` or `electron`, the `picomatch` advisory (#4).

### Story 2: Packaging and tooling still work
**As a** maintainer
**I want to** confirm the override did not break consumers of minimatch's API
**So that** releases and quality scripts keep working

**Acceptance Criteria:**
- [ ] Given the override, when `npm run build:e2e` (web bundle plus `electron-builder --win --dir`) runs, then it succeeds and
      the unpacked app in `dist/win-unpacked` contains `electron/**`, `build/**` and `package.json`, and does **not** contain
      `electron/**/__tests__/**` or `build/README.md`. These are the `build.files` glob rules, and electron-builder
      evaluates them with minimatch.
- [ ] Given the override, when `npm run types:coverage` runs, then it completes and reports a coverage percentage similar
      to the one before the change.
- [ ] Given the override, when `npm run typecheck`, `npm run lint` and `npm run test:all` run, then all pass.
- [ ] Edge case: if minimatch 11 breaks a consumer (for example a removed export or option), drop that parent's override,
      record the residual advisory in this ticket, and stop and ask.

**Out of scope:** running the NSIS installer build (`build:win`) or e2e suites.

---

## 4. Design & Reference Assets

No UI change.

---

## 5. Technical Notes / Implementation Guidance

- **Affected files:** `package.json` (`overrides`), `package-lock.json`.
- **Owning layer:** tooling or build. The Electron packaging config is in `package.json` → `build`, and `electron/**` needs no change.
- **Test lane:** `npm run test:all` plus the packaging check above. Use the `electron-expert` skill if packaging issues come up.
- `minimatch@11` requires Node `20 || >=22` (11.0.9; earlier 11.0.x also allowed 18), so it is compatible with the Node 24.22.3 pin.

---

## 6. Dependencies & Risks

- **Blocked by:** 2
- **Blocks:** —
- **Risks/open questions:**
  - `@electron/universal` is pinned exactly by `app-builder-lib`, so its upstream will not move without an electron-builder
    release. Remove the override once electron-builder ships `minimatch@>=11.0.1`.
  - `type-coverage-core` declares `minimatch` up to 10, so npm may report an out-of-range warning for it
    (overrides are usually applied without one). If it appears, it is expected.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass locally, and `npm run build:e2e` packages correctly
- [ ] `code-reviewer` subagent run and findings addressed
- [ ] Squash-merged into `dev-20261117-npm-audit-fixes` as `chore: #3 override vulnerable transitive minimatch`

---

## 8. Links

- Parent batch: [tickets/plan.md](./plan.md)
- Related tickets: [#2](./2-remove-vulnerable-glob.md), [#4](./4-picomatch-redos-audit-gate.md)
- Advisory: https://github.com/advisories/GHSA-g3hv-75wg-m249
