# [BUG] Fix the 3 failing unit tests in test:all (mock reset and jest-dom matchers)

> **Ticket type:** Bug
> **Status:** Done
> **Priority:** P1
> **Epic:** [npm audit remediation batch](./plan.md) — batch issue #<TBD>
> **Sprint:** `dev-20261117-npm-audit-fixes`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Locally on Windows, `npm run test:all` failed 3 of its 20 tests (20 tests: 16 `electron`, 2 `react`, 2 `storybook`). Mock call history was not cleared between Electron tests, and jest-dom matchers were missing in
the React test. The root cause turned out to be Vitest loading itself twice when started from a lower-case drive letter
(see Outcome), not the tests or app code.

---

## 2. Problem / Opportunity

- **Problem statement:** these tests failed on every local run from the VS Code workspace (`e:\Dev\personal\bicam`):

  | Test | Project | Error |
  | --- | --- | --- |
  | `electron/__tests__/main.test.ts:79` › `openExternalSafely` › "ignores other protocols and malformed URLs" | `electron` | `expected "vi.fn()" to not be called at all, but actually been called 1 times`. The recorded call is `"https://example.com"`, from the previous test. |
  | `electron/__tests__/main.test.ts:144` › `bootstrap` › "registers Windows lifecycle and security handlers…" | `electron` | `expected "vi.fn()" to be called 1 times, but got 5 times` on `BrowserWindow`. Earlier `createMainWindow` tests left their calls behind. |
  | `src/__tests__/App.test.tsx:6` › "renders the project name as the page heading" | `react` | `Error: Invalid Chai property: toBeInTheDocument` |

- **Evidence (2026-11-17, Windows 11, Node 24.22.3, `vitest@5.1.0`, `@testing-library/jest-dom@7.0.1`):**
  - The same 3 tests failed with and without the npm audit batch changes (#2 to #4). This was checked by stashing #3
    and running `npm ci` + `npm run test:all` on the committed tree.
  - They also failed when each project ran on its own (`npx vitest run --project electron`, `--project react`), so
    this was not interference between Vitest projects.
  - `vitest@^5.1.0` and `@testing-library/jest-dom@^7.0.1` were added together in `2a02d65` and have not changed since.
- **What the setup does (observed):**
  - `electron/__tests__/main.test.ts:33-35` calls `vi.clearAllMocks()` in `beforeEach`. The `electron` mocks are
    `vi.fn()`s created in a `vi.mock('electron', …)` factory in `vitest-electron.setup.ts`, which imports `vi` from
    `vitest`. Their call history carried over between tests.
  - `vitest-react.setup.ts:2` imports `@testing-library/jest-dom/vitest`, which runs `expect.extend(matchers)` on the
    `expect` imported from `vitest`. The test file uses the global `expect` (`globals: true`), which reported
    `Invalid Chai property: toBeInTheDocument`.
- **Success metric(s):** `npm run test:all` exits 0 locally, from either drive-letter case, and in the CI
  `Run all unit/component tests` step.

---

## 3. User Stories

### Story 1: Electron tests start each case with clean mocks
**As a** maintainer
**I want to** have the `electron` mocks reset between tests
**So that** each Electron test checks only its own calls

**Acceptance Criteria:**
- [x] Given `npm run test:electron`, when it runs, then all tests in the `electron` project pass (16 today), including
      `main.test.ts:79` and `:144`.
- [x] Given the fix, when the assertions in `electron/__tests__/main.test.ts` are compared before and after, then none are
      removed, loosened (for example `toHaveBeenCalledTimes(1)` changed to `toHaveBeenCalled()`) or skipped.
      *(The test file is unchanged.)*
- [x] Given the fix, when the file runs in random order with fixed seeds
      (`npm run test:electron -- --sequence.shuffle --sequence.seed=<n>` for n = 1, 2, 3), then every run passes.
      If an unrelated order-dependence shows up, it gets a follow-up ticket instead of blocking this one.
- [x] Given the fix, when `npm run test:all:coverage` runs, then the `electron/**` thresholds (90% in `vitest.config.ts`)
      pass. *(electron/main.ts: 98.33% statements, 91.66% branches, 100% functions, 98.11% lines; exit 0.)*

**Out of scope:** changing `electron/main.ts` behaviour, or the Electron security posture (`contextIsolation`,
`nodeIntegration`, `sandbox`).

### Story 2: jest-dom matchers work in the React project
**As a** maintainer
**I want to** have `toBeInTheDocument` and the other jest-dom matchers available in every `react` and `store` test
**So that** component tests can use the standard Testing Library assertions

**Acceptance Criteria:**
- [x] Given `npm run test:react`, when it runs, then `src/__tests__/App.test.tsx` passes with its
      `toBeInTheDocument()` assertion unchanged.
- [x] Given the fix, when `npm run typecheck` runs, then jest-dom matcher types still resolve in test files.
- [x] Given the fix, when `npm run test:storybook` runs, then it still passes.

**Out of scope:** adding new tests, upgrading `vitest` or `@testing-library/jest-dom` (an upgrade or downgrade goes through
`/npm-upgrade`, so stop and ask).

---

## 4. Design & Reference Assets

No UI change.

---

## 5. Technical Notes / Implementation Guidance

- **Affected files:** `scripts/vitest.mjs` (new), `package.json` (`test:*` scripts),
  `.claude/skills/coverage-analysis/SKILL.md`.
- **Owning layer:** test infrastructure. No `src/**` app code, `electron/**` code or test files changed.
- **Test lanes:** `npm run test:electron`, `npm run test:react`, `npm run test:storybook`, `npm run test:all`,
  `npm run test:all:coverage`, `npm run typecheck`.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** —
- **Risks/open questions:**
  - Tools that start Vitest themselves bypass `scripts/vitest.mjs`, so on a lower-case drive path they can still show
    these failures. Examples: the VS Code Vitest extension, Storybook's test panel (`@storybook/addon-vitest`) and a bare
    `npx vitest`. Workaround: open the folder as `E:\...`. Owner: Stanislav Spuzyak.
  - Remove the launcher once Vitest normalizes the drive letter consistently itself. Re-test by running `npx vitest run`
    from an `e:\...` shell after each Vitest upgrade.

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] `npm run typecheck`, `npm run lint` and `npm run test:all` pass locally
- [x] Root cause recorded in this ticket (confirmed or ruled-out hypothesis)
- [x] `code-reviewer` subagent run and findings addressed
- [ ] Squash-merged into `dev-20261117-npm-audit-fixes` as `fix: #5 fix failing electron and react unit tests`
      *(Not applicable: at the user's direction this batch is committed directly on `1-initial-setup`. The dev branch
      does not exist yet.)*

### Outcome (2026-11-17)

- **Root cause (confirmed):** on Windows, starting Vitest from a shell whose cwd has a lower-case drive letter (`e:\...`,
  which is how VS Code opens this workspace) loads Vitest twice:
  - The CLI and its workers load Vitest from the `e:/...` path, and `globals: true` installs the global `vi` and
    `expect` from that copy.
  - Imports of `vitest` in setup and test files resolve through the project root, which Vitest normalizes to `E:/...`.
  - Node caches ES modules by URL, so these are two separate instances.

  The setup files changed the imported `vi` and `expect`, while the tests used the global ones. That explains both
  failures: `vi.clearAllMocks()` on the global `vi` doesn't clear mocks created by the other instance, and jest-dom
  extended the other `expect`.
- **How it was confirmed:**
  - A temporary diagnostic test printed `globalThis.expect === importedExpect` → `false` and
    `globalThis.vi === importedVi` → `false`. The imported `expect` had `toBeInTheDocument` and the global one didn't.
  - The same `vitest run --project react --project electron`, started via `cmd /c "cd /d E:\Dev\personal\bicam && …"`,
    passed 18/18. Started from `e:\Dev\personal\bicam`, it failed the same 3 tests.
- **Ruled out:**
  - The hoisted `@vitest/expect@3.2.4` (from Storybook) is not involved. `vitest@5.1.0` bundles its own `expect` and
    does not depend on `@vitest/expect`.
  - Interference between projects is ruled out, since each project failed on its own.
  - Calling `process.chdir()` to an upper-case path from `vitest.config.ts` did not help, because the CLI has already
    loaded Vitest from the lower-case path by the time the config runs.
- **Fix (user's choice of three options):** `scripts/vitest.mjs` upper-cases the drive letter on Windows and starts
  `node_modules/vitest/vitest.mjs` from that path, passing arguments, stdio and the exit code through. It does nothing
  extra on other platforms. It forwards `SIGTERM` to Vitest, ignores `SIGINT` (the console already delivers Ctrl+C to
  Vitest directly), reports a start failure with a clear message and exit 1, and exits with 128 + signal number if Vitest
  is killed by a signal. All `test:*` scripts that called `vitest` now call `node scripts/vitest.mjs`.
  `.claude/skills/coverage-analysis/SKILL.md` now uses the launcher instead of `npx vitest`.
- **CI:** the failures only happen on Windows with a lower-case drive letter. Linux CI never hit them, so the
  earlier plan note that the dev → master PR would be red on the unit-test step was wrong. CI was not run for this ticket.
- **Local results (all run from `e:\Dev\personal\bicam`):**
  - `test:all`: 20/20 passed, exit 0.
  - `test:electron`: 16/16. `test:react`: 2/2. `test:storybook`: 2/2.
  - The shuffled `test:electron` runs with seeds 1, 2 and 3 each passed 16/16.
  - `test:all:coverage` exited 0.
  - `typecheck` and `lint` pass.
  - A run with an unknown `--project` exits 1 through the launcher, so failures still reach npm.
- **Pre-existing, outside this ticket:**
  - An electron-only coverage run (`node scripts/vitest.mjs run --coverage --project=electron`) fails its global 90%
    thresholds. The coverage `include` still counts `src/**` files at 0%; `electron/main.ts` itself is at 98%.
  - `npm run quality:unused` (knip) fails the same way with and without this change: unused `zustand`,
    `@chromatic-com/storybook`, `@storybook/addon-onboarding` and `@testing-library/user-event`. It does not flag
    `scripts/vitest.mjs`.
  - `CLAUDE.md` points to `docs/package-scripts.md`, which does not exist.

---

## 8. Links

- Parent batch: [tickets/plan.md](./plan.md)
- Related tickets: [#3](./3-override-vulnerable-minimatch.md) (where the failures were first recorded),
  [#4](./4-picomatch-redos-audit-gate.md)
