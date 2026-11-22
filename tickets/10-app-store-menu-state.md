# [FEATURE] Add `useAppStore` with menu and active-screen state

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (#6)
> **Sprint:** `6-menu-introduce-and-set-placeholders`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Create the app's single Zustand store, `useAppStore`, holding whether the menu is open and which screen is active, so
the header, the menu, and `<main>` share one source of truth.

---

## 2. Problem / Opportunity

- **Problem statement:** The header button, the menu screen, and the main viewport all depend on the menu state and the
  active screen. Keeping that in React local state would duplicate shared state, which `CLAUDE.md` forbids.
- **Evidence:** [Design §3](../docs/design/app-menu.md#3-state-srcstore).
- **Success metric(s):** All menu behavior in later tickets reads and writes this store only.

---

## 3. User Stories

### Story 1: Shared menu state
**As a** developer
**I want to** open, close, and toggle the menu through store actions
**So that** any component can react to the menu state without prop drilling or duplicate state

**Acceptance Criteria:**
- [ ] Given a fresh store, then `isMenuOpen` is `false` and `activeScreen` is `'home'`.
- [ ] Given the menu is closed, when `toggleMenu()` runs, then `isMenuOpen` is `true`; running it again sets `false`.
- [ ] `openMenu()` sets `true` and `closeMenu()` sets `false`, and both are idempotent.

**Out of scope:** Persisting state, any UI.

### Story 2: Navigate to a screen
**As a** developer
**I want to** set the active screen with one action that also closes the menu
**So that** choosing a menu option never leaves the menu open

**Acceptance Criteria:**
- [ ] Given the menu is open, when `navigateTo('addBicycle')` runs, then `activeScreen` is `'addBicycle'` and `isMenuOpen` is `false`.
- [ ] `reset()` restores `INITIAL_APP_STATE` after any change.
- [ ] Edge case: `navigateTo` with the already-active screen still closes the menu.

**Out of scope:** Routing, history, a "back" action.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design spec | [docs/design/app-menu.md §3](../docs/design/app-menu.md#3-state-srcstore) | Field/action table |
| Existing pattern | `.claude/skills/storybook-expert/SKILL.md` §2 | Store name, `@store/types` imports, seeding via `setState` |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand store, `src/store/`.
- **Files:** `src/store/types.ts` (`ScreenView`, `MenuScreen`, `AppStoreState`, `AppStoreActions`, `AppStore`),
  `src/store/constants.ts` (`INITIAL_APP_STATE`), `src/store/useAppStore.ts`, `src/store/__tests__/useAppStore.test.ts`.
- `create<AppStore>()((set) => ({ ...INITIAL_APP_STATE, ...actions }))`. No middleware.
- **Test lane:** `npm run test:store` (90% branch threshold for `src/store/**`).

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** #13, #14, #15
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (`npm run test:store`)
- [ ] JSDoc on every exported function and type

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#13](./13-menu-screen-placeholders.md), [#14](./14-app-menu-screen.md), [#15](./15-wire-menu-into-app.md)
- Design file: [docs/design/app-menu.md](../docs/design/app-menu.md)
