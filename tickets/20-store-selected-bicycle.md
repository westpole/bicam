# [FEATURE] Track the selected bicycle in the store

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #10)
> **Sprint:** `10-ui-introduce-bicycle-list`
> **Estimate:** S

---

## 1. Summary

Add a `bicycleDetails` screen and a `selectedBicycleId` to the store, with an `openBicycleDetails(id)` action, so the
UI (#21) can open the details screen for one bicycle and the store guarantees that bicycle exists.

---

## 2. Problem / Opportunity

- **Problem statement:** Navigation (`activeScreen`) has no notion of a selected entity, so no screen can show "this
  bicycle".
- **Evidence:** `ScreenView` lists only `home` and the four menu screens; there is no selection field.
- **Success metric(s):** After any action, `activeScreen === 'bicycleDetails'` holds exactly when `selectedBicycleId`
  is a stored bicycle id.

---

## 3. User Stories

### Story 1: Navigation state knows the selected bicycle
**As a** developer
**I want to** the store to hold the selected bicycle together with the active screen
**So that** the details screen can never show the wrong or a missing bicycle

**Acceptance Criteria:**
- [ ] `ScreenView` stays a literal union and adds `'bicycleDetails'`:
      `'home' | 'addBicycle' | 'addComponent' | 'addClothesSet' | 'beforeRideCheckIn' | 'bicycleDetails'`.
- [ ] `MenuScreen` becomes `Exclude<ScreenView, 'home' | 'bicycleDetails'>`, so the menu still lists exactly its four
      options.
- [ ] New root UI field `selectedBicycleId: BicycleId | null`, `null` in `INITIAL_APP_STATE`.
- [ ] New action `openBicycleDetails(id): boolean`: for a stored id it sets `activeScreen: 'bicycleDetails'`,
      `selectedBicycleId: id`, `isMenuOpen: false` in one update and returns `true`.
- [ ] Edge case: for an unknown id (including `'__proto__'` / `'toString'`, checked with `hasBicycle`)
      `openBicycleDetails` returns `false` and changes nothing.
- [ ] `navigateTo(screen)` takes `Exclude<ScreenView, 'bicycleDetails'>` and also sets `selectedBicycleId: null`.
- [ ] `reset()` restores `selectedBicycleId: null`.

**Out of scope:** any UI change (#21); persisting the selection (it is UI state; when persistence arrives it is excluded
by `partialize`).

---

### Story 2: Removing the shown bicycle leaves the details screen
**As a** rider
**I want to** be taken back to the start screen if the bicycle I am looking at is deleted
**So that** I never see a details screen for a bicycle that no longer exists

**Acceptance Criteria:**
- [ ] Given `activeScreen: 'bicycleDetails'` with `selectedBicycleId: X`, when `removeBicycle(X)` succeeds, then
      `selectedBicycleId` is `null` and `activeScreen` is `'home'`, and it returns `true`.
- [ ] Given the same state, when `removeBicycle(Y)` removes a different bicycle, then the selection and screen are
      unchanged.
- [ ] Given an unknown id, `removeBicycle` still returns `false` and changes nothing.
- [ ] The bicycle slice (`src/store/bicycle/createBicycleSlice.ts`) is **not** changed: the navigation reset lives in a
      `removeBicycle` wrapper in `src/store/useAppStore.ts`.

**Out of scope:** a confirmation dialog or any UI for deleting bicycles.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design doc | [docs/design/bicycle-card-list.md](../docs/design/bicycle-card-list.md) §3 | Store contract, why `removeBicycle` is wrapped, the invariant |
| Store docs | [docs/store/README.md](../docs/store/README.md), [docs/store/bicycle.md](../docs/store/bicycle.md) | Conventions; current `removeBicycle` behavior |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Affected files:**
  - `src/store/types.ts` — `ScreenView`, `MenuScreen`, `selectedBicycleId`, `openBicycleDetails`, narrowed
    `navigateTo`. Update the JSDoc: `ScreenView` no longer says `home` is "empty for now"; `MenuScreen` no longer says
    "every screen except `home`".
  - `src/store/constants.ts` — `selectedBicycleId: null`; update the `INITIAL_APP_STATE` JSDoc to mention no selected
    bicycle.
  - `src/store/useAppStore.ts` — `openBicycleDetails`, `navigateTo`; keep a reference to the slice
    (`const bicycleSlice = createBicycleSlice(set, get, api)`), spread it, then override `removeBicycle` with a wrapper
    that calls `bicycleSlice.removeBicycle(id)` and, when it returns `true` and `get().selectedBicycleId === id`, sets
    `{ selectedBicycleId: null, activeScreen: 'home' }`.
  - `src/store/__tests__/useAppStore.test.ts` — all acceptance criteria above.
- **Typecheck traps:** `AppMenu.tsx`, `AppMenu.test.tsx`, `AppMenu.stories.tsx`, `Placeholders.stories.tsx`, and
  `screens/constants.ts` import `ScreenView` / `MenuScreen`; they should compile unchanged if `MenuScreen` is narrowed
  correctly. `App.tsx` indexes `SCREEN_COMPONENTS[activeScreen]` after excluding only `'home'`, so it will fail to
  typecheck (TS7053: `'bicycleDetails'` cannot index `Record<MenuScreen, …>`). Change the condition to
  `activeScreen === 'home' || activeScreen === 'bicycleDetails' ? null : SCREEN_COMPONENTS[activeScreen]`, so the
  details screen renders nothing for now (#21 replaces it with the real screen).
- **Docs:** [docs/store/README.md](../docs/store/README.md) §1 (root shape snippet and key table: `selectedBicycleId`,
  new `ScreenView` member), §3 (file layout comment for `types.ts`), and §5 (Decisions: "Navigation side effects of
  domain actions live in `useAppStore.ts` wrappers, not in slices"). Mention the wrapper's side effect in
  [docs/store/bicycle.md](../docs/store/bicycle.md) §4.
- **Owning layer:** Zustand (`src/store/**`). One guard line in `src/App.tsx` for type safety only.
- **Tests:** `npm run test:store` (see the `zustand-unit-tests` skill), then `npm run test:react` to confirm `App` and
  `AppMenu` tests are unaffected.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** [#21](./21-open-bicycle-details-from-card.md)
- **Risks/open questions:**
  - The wrapper makes two `set` calls (bicycle, then UI). React batches them into one render; a non-React subscriber
    could see one in-between notification. Accepted; `App` guards the details branch (design doc §4.5).

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Store tests written and passing (`npm run test:store`); `src/store/**` meets the 90% branch threshold
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:react` pass
- [ ] Store docs updated
- [ ] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Design: [docs/design/bicycle-card-list.md](../docs/design/bicycle-card-list.md)
- Related tickets: [#19](./19-bicycle-card-list-on-home.md), [#21](./21-open-bicycle-details-from-card.md)
- PR(s): —
