# [TEST] Align e2e specs and visual snapshots with the app shell

> **Ticket type:** Test
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) — #4
> **Sprint:** `4-ui-introduce-application-grid-and-theme-setup`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Replace the e2e assertions that expect a centered splash title with assertions for the new shell: the header pinned at
the top, `<main>` as the only scroll container, the menu button visible, and dark mode following the OS. Cover this in
Electron (`e2e/ui/layout.spec.ts`) and on web mobile (`e2e/mobile/app.spec.ts`). Then regenerate the existing visual
baselines in Docker, so the batch → master PR passes CI.

---

## 2. Problem / Opportunity

- **Problem statement:** After #7 and #8, `e2e/ui/layout.spec.ts` ("centers the title…") and `e2e/visual/app.spec.ts`
  snapshots fail. CI runs both e2e jobs on PRs to `master`, so the batch cannot merge.
- **Evidence:** `e2e/ui/layout.spec.ts` asserts the `<h1>` center is within 2px of the window center, before and after resizing to 480 × 640.
- **Success metric(s):** `npm run test:e2e:docker` is green locally, and both CI e2e jobs are green on the batch → master PR.

---

## 3. User Stories

### Story 1: Layout regression coverage for the shell
**As a** developer
**I want to** have e2e tests that prove the header stays put while content scrolls, in Electron (`layout.spec.ts`) and on web mobile (`mobile/app.spec.ts`)
**So that** later screens cannot break the shell without CI noticing

**Shared shell assertions** (referred to below as *the shell checks*). All geometry is relative to the header's
**measured** bounding box. Never hard-code a toolbar height (it is 56, 48, or 64px depending on the viewport; see the
design doc's §2.2). Compare with a 1px tolerance.
- (a) The header's top edge is at `y = 0`, and the header spans the full inner width.
- (b) The `<main>` top edge equals the header's bottom edge, and `<main>`'s bottom equals `window.innerHeight`.
- (c) After injecting tall content into `<main>` (via `page.evaluate`) and scrolling it, the header's bounding box is unchanged, `main.scrollTop > 0`, and `document.scrollingElement.scrollTop === 0`.

**Acceptance Criteria — Electron (`e2e/ui/layout.spec.ts`, project `electron-ui`):**
- [ ] The two "centered title" tests are replaced by the shell checks (a)–(c), run at the default window size and again after `setContentSize(480, 640)`.
- [ ] The existing "follows the system dark color scheme" test still passes. Extend it to also assert that the `banner` background color changes.

**Acceptance Criteria — web mobile (`e2e/mobile/app.spec.ts`, projects `web-mobile-portrait` 412 × 915 and `web-mobile-landscape` 915 × 412):**
- [ ] The shell checks (a)–(c) pass in both projects. In landscape the measured header is 64px, because the viewport is ≥ 600px wide; the test must not assume 48px.
- [ ] The menu button (`name: 'Open menu'`) and the h1 are visible and on the same row (vertical centers within 4px).

**Acceptance Criteria — unchanged specs:**
- [ ] Existing h1-based checks in `e2e/electron/smoke.spec.ts` and `e2e/integration/security.spec.ts` pass unchanged.

**Out of scope:** New Electron behavior, and tests for the menu drawer.

---

### Story 2: Regenerated visual baselines
**As a** developer
**I want to** have the existing light and dark visual snapshots regenerated for the new shell
**So that** visual regressions are caught against the right baseline

**Acceptance Criteria:**
- [ ] `e2e/visual/app.spec.ts` already has `light theme` and `dark theme` tests (using `emulateMedia({ colorScheme })`). Keep both, and only adjust their waits and locators if the shell needs it (for example, wait for the `banner` instead of a centered h1).
- [ ] **Regenerate both existing baselines** in `e2e/visual/app.spec.ts-snapshots/` with `npm run test:e2e:docker:update-snapshots` (never on the host OS, to match CI rendering).
- [ ] The regenerated light and dark PNGs are reviewed by eye against the design doc's §2 wireframes before committing.

**Out of scope:** Visual tests for individual components (Storybook covers those). Web visual snapshots: none exist, and
`test:e2e:docker:update-snapshots` only runs the `electron-visual` project.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Wireframes | [docs/design/app-shell-and-theme.md §2](../docs/design/app-shell-and-theme.md#2-wireframes) | Expected geometry per viewport |
| Verification table | [docs/design/app-shell-and-theme.md §8](../docs/design/app-shell-and-theme.md#8-verification) | What e2e must prove |
| Current specs | `e2e/ui/layout.spec.ts`, `e2e/mobile/app.spec.ts`, `e2e/visual/app.spec.ts` | Assertions to replace or extend |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** e2e tests (`e2e/**`). No production code changes. If a test reveals a shell bug, stop and fix it in a follow-up to #7/#8 rather than here.
- **Skill:** use `e2e-test-expert`.
- **Run:** `npm run test:e2e:docker:web`, `npm run test:e2e:docker:electron`, `npm run test:e2e:docker:update-snapshots`. Requires Docker locally (see `docker/e2e/compose.yml`).
- **Locators:** role-based (`getByRole('banner')`, `getByRole('main')`, `getByRole('button', { name: 'Open menu' })`). Do not use CSS class selectors from Emotion.
- **Feature flag:** none.

---

## 6. Dependencies & Risks

- **Blocked by:** [#8](./8-header-menu-button.md)
- **Blocks:** batch → master PR for batch #4
- **Risks/open questions:**
  - Needs a working local Docker setup. If Docker is unavailable, stop and ask (the plan's workflow skips e2e for the other tickets for this reason).
  - Sub-pixel rounding at `dvh` heights: compare geometry with a 1px tolerance.
  - Toolbar height varies by viewport (56/48/64px). Every assertion uses the measured header box, so the tests do not depend on which height applies.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `npm run test:e2e:docker` passes locally
- [ ] Snapshot diffs reviewed and committed
- [ ] `npm run typecheck` and `npm run lint` pass
- [ ] `code-reviewer` subagent run, findings addressed
- [ ] Committed directly on `4-ui-introduce-application-grid-and-theme-setup` (no ticket branch) as `<type>: #4 <description>`

---

## 8. Links

- Parent epic: [plan.md](./plan.md) (#4)
- Related tickets: [#7](./7-app-shell-layout.md), [#8](./8-header-menu-button.md)
- PR(s): —
- Design file: [docs/design/app-shell-and-theme.md](../docs/design/app-shell-and-theme.md)
