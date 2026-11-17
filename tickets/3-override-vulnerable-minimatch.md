# [CHORE] Override transitive minimatch 9.x/10.x to a patched 11.x

> **Ticket type:** Chore
> **Status:** Done
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
- [x] Given `package.json`, when the fix is applied, then the `overrides` entries are **scoped** to the affected parents
      (`app-builder-lib`, `@electron/universal`, `type-coverage-core`, and `glob` only if #2 did not remove it).
      There is no global `minimatch` override, which would also break the `^3` and `^5` consumers.
      *(`@electron/universal` is covered by the `app-builder-lib` entry; see Outcome.)*
- [ ] Given #2 used its fallback (a `glob >=14.0.2` override instead of removing glob), when `npm ls minimatch --all`
      runs, then check the `minimatch` copy under the overridden `glob`. If it is in `>=7.0.0 <11.0.1`, add a scoped
      `minimatch@^11.0.1` override under that `glob` entry. If glob 14 already brings a patched minimatch, record that
      here and add nothing. *(n/a: #2 removed `glob@13` without the fallback.)*
- [x] Given a clean install, when `npm ls minimatch --all` runs, then no copy is in `>=7.0.0 <11.0.1`.
- [ ] Given the updated lockfile, when `npm audit` runs, then `minimatch`, `electron-builder`, `app-builder-lib`,
      `@electron/universal`, `@electron/rebuild` and `node-gyp` are no longer listed.
      *(Partly met: `minimatch` and `@electron/universal` are gone. `electron-builder`, `app-builder-lib`, `@electron/rebuild`
      and `node-gyp` are still listed, now only through `node-gyp` → `tinyglobby` → `picomatch`, which is #4's scope.)*

**Out of scope:** upgrading `electron-builder` or `electron`, the `picomatch` advisory (#4).

### Story 2: Packaging and tooling still work
**As a** maintainer
**I want to** confirm the override did not break consumers of minimatch's API
**So that** releases and quality scripts keep working

**Acceptance Criteria:**
- [x] Given the override, when `npm run build:e2e` (web bundle plus `electron-builder --win --dir`) runs, then it succeeds and
      the unpacked app in `dist/win-unpacked` contains `electron/**`, `build/**` and `package.json`, and does **not** contain
      `electron/**/__tests__/**` or `build/README.md`. These are the `build.files` glob rules, and electron-builder
      evaluates them with minimatch.
      *(Checked inside `resources/app.asar`. The `!build/README.md` rule is not really exercised, because the web build
      output has no `build/README.md`.)*
- [x] Given the override, when `npm run types:coverage` runs, then it completes and reports a coverage percentage similar
      to the one before the change. *(99.84%, 1298 / 1300, before and after.)*
- [ ] Given the override, when `npm run typecheck`, `npm run lint` and `npm run test:all` run, then all pass.
      *(`typecheck` and `lint` pass. `test:all` has 3 failures that also fail on the committed tree without this change;
      see Outcome.)*
- [ ] Edge case: if minimatch 11 breaks a consumer (for example a removed export or option), drop that parent's override,
      record the residual advisory in this ticket, and stop and ask. *(n/a: no consumer broke.)*

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

- [x] Acceptance criteria met or explicitly deferred: the `npm audit` item is deferred to #4 (`picomatch`), and the
      `test:all` item is deferred to a separate ticket for the pre-existing failures (marked Done at the user's direction)
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass locally, and `npm run build:e2e` packages correctly
      *(All pass except the 3 `test:all` failures that already fail without this change.)*
- [x] `code-reviewer` subagent run and findings addressed
- [ ] Squash-merged into `dev-20261117-npm-audit-fixes` as `chore: #3 override vulnerable transitive minimatch`
      *(Not applicable: at the user's direction this ticket is committed directly on `1-initial-setup`. The dev branch
      does not exist yet.)*

### Outcome (2026-11-17)

- **Overrides added:**
  - `"app-builder-lib": { "minimatch@>=7.0.0 <11.0.1": "^11.0.1" }`
  - `"type-coverage-core": { "minimatch": "^11.0.1" }`
- **Why the version range on the `app-builder-lib` key:** a nested npm override applies to the parent's whole subtree.
  A plain `minimatch` key under `app-builder-lib` would also force `^3` (`@electron/asar`, `dir-compare`, `rimraf` → `glob@7`)
  and `^5` (`filelist`) onto 11. The range key matches only edges whose spec intersects the affected range, so it catches
  `app-builder-lib`'s `^10.2.5` and `@electron/universal`'s `^9.0.3` and leaves `^3` and `^5` alone. This is why there
  is no separate `@electron/universal` entry. A plain key there would also hit `dir-compare`'s `^3`.
  `type-coverage-core` has no other `minimatch` below it, so it uses a plain key.
- **`type-coverage-core` runs outside its declared range:** 2.31.2 declares `minimatch: "6 || 7 || 8 || 9 || 10"`, so the
  override forces a major version it does not claim to support. `npm run types:coverage` still works (99.84%, unchanged).
  Re-run `npm run types:coverage` after **every** `type-coverage` upgrade, not only when the declared range reaches 11.
- **Lockfile:** a normal `npm install` kept the old nested copies and `npm ls` reported them `invalid`. The three stale
  entries (`app-builder-lib`, `@electron/universal` and `type-coverage-core` → `node_modules/minimatch`) were deleted from
  `package-lock.json` before reinstalling. All three now dedupe to the top-level `minimatch@11.0.9`. The lockfile diff only
  removes entries: those three plus `@electron/universal`'s nested `brace-expansion@2` and `balanced-match@1`. A clean
  `npm ci` reproduces the same tree.
  **For future overrides:** when an override replaces a nested copy that is already locked, delete that copy's
  `node_modules/<parent>/node_modules/<pkg>` entry from `package-lock.json` (and from `node_modules`) before `npm install`.
  Then confirm that `npm ls <pkg> --all` shows no `invalid`.
- **`npm audit`** (`metadata.vulnerabilities` from `npm audit --json`, run before and after this change): 45 → 43 (moderate 5 → 0, high 40 → 43).
  Every remaining finding is high, and all of them come from `picomatch` (#4).
- **Pre-existing `test:all` failures:** the same 3 tests fail with and without this change (checked by stashing it and
  running `npm ci` + `npm run test:all` on the committed tree):
  - `electron/__tests__/main.test.ts:79`: `openExternalSafely` > "ignores other protocols…" (mock called once; looks like
    call state leaking between tests).
  - `electron/__tests__/main.test.ts:144`: `bootstrap` > `BrowserWindow` called 5 times instead of once (same cause).
  - `src/__tests__/App.test.tsx:6`: `Invalid Chai property: toBeInTheDocument` (jest-dom matchers not registered for the
    `react` project).
  They are outside this ticket's scope and need their own ticket.
- **Removal conditions:** tracked in the plan's [Override removal](./plan.md#override-removal) table.

---

## 8. Links

- Parent batch: [tickets/plan.md](./plan.md)
- Related tickets: [#2](./2-remove-vulnerable-glob.md), [#4](./4-picomatch-redos-audit-gate.md)
- Advisory: https://github.com/advisories/GHSA-g3hv-75wg-m249
