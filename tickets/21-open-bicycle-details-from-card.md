# [FEATURE] Open a Bicycle details placeholder from a card

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #10)
> **Sprint:** `10-ui-introduce-bicycle-list`
> **Estimate:** M

---

## 1. Summary

Make each bicycle card on the Home screen clickable. Clicking a card calls `openBicycleDetails` (#20) and shows a new
Bicycle details placeholder screen titled with that bicycle's name.

---

## 2. Problem / Opportunity

- **Problem statement:** After #19 the cards only display data; there is no way to drill into a bicycle.
- **Evidence:** No details screen exists, and `CardList` has no click handling.
- **Success metric(s):** Clicking any card shows the details placeholder for exactly that bicycle.

---

## 3. User Stories

### Story 1: Open a bicycle from its card
**As a** rider
**I want to** tap a bicycle card on the Home screen
**So that** I can open that bicycle's details

**Acceptance Criteria:**
- [ ] Given `home` with bicycles, then each card's content is one native `<button>` (`ButtonBase component="button"
      type="button"`) filling the `Paper`, whose accessible name is the bicycle name.
- [ ] Given a card, when the user clicks it or focuses it and presses Enter or Space, then `<main>` shows the Bicycle
      details placeholder: an `<h2>` with that bicycle's name and the line "This screen is coming soon."
- [ ] Given keyboard focus on a card, then a visible focus outline is drawn inside the card's rounded corners.
- [ ] Given the menu is open, then the cards are not reachable (existing `inert` on `<main>`), unchanged.
- [ ] Given the details screen, when the user picks a menu option, then that option's screen replaces it (`navigateTo`
      clears the selection, #20).
- [ ] Edge case: a long name on the details screen wraps and does not overflow at 320px (existing `ScreenPlaceholder`
      behavior).

**Out of scope:** real details content; a back button; moving focus to the details heading; routing/URLs; event icons.

---

### Story 2: Reusable cards accept a click handler
**As a** developer
**I want to** `CardList` to report which card was activated
**So that** any future card list can navigate the same way

**Acceptance Criteria:**
- [ ] `CardList` gets a required `onItemClick: (id: Id) => void` prop, called with the activated item's `id`.
- [ ] `Home` gets `onBicycleClick: (id: BicycleId) => void` and passes it through.
- [ ] `CardList` still imports nothing from `src/store/**`.

**Out of scope:** optional/non-clickable cards; secondary actions.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design doc | [docs/design/bicycle-card-list.md](../docs/design/bicycle-card-list.md) §2.4, §4.1 (click target), §4.4, §4.5, §5 | Details wireframe, `ButtonBase` styles, `App` wiring, a11y |
| Existing screen | `src/ui/components/screens/ScreenPlaceholder/` | Reused for the details placeholder |

Text fallback: after a click the screen shows the bicycle's name as a heading and "This screen is coming soon." below
it in secondary text, under the unchanged header.

---

## 5. Technical Notes / Implementation Guidance

- **Affected files:**
  - `src/ui/components/CardList/` — `onItemClick`, `ButtonBase` wrapper, tests (click, Enter, Space, focus outline) and
    a story play test that clicks a card and asserts `onItemClick` (`fn()`).
  - `src/ui/components/screens/Home/` — `onBicycleClick` prop, tests, stories.
  - New `src/ui/components/screens/BicycleDetails/` — `BicycleDetails.tsx`, `types.ts`, `BicycleDetails.test.tsx`,
    `BicycleDetails.stories.tsx` (Desktop / Mobile `mobile1` / Dark / LongName), rendering
    `<ScreenPlaceholder title={name} />`.
  - `src/App.tsx` — select `selectedBicycleId` and `openBicycleDetails`; replace #20's empty `bicycleDetails` branch with
    the real screen per design doc §4.5 (keep the commented `selectedBicycle &&` guard).
  - `src/ui/components/screens/constants.ts` — extend the `SCREEN_COMPONENTS` JSDoc (updated in #19): `bicycleDetails`
    has no entry either, because `App` renders it with props.
  - `src/__tests__/App.test.tsx`, `src/App.stories.tsx` — `HomeToDetails`: seed two bicycles, click the second, assert
    its `<h2>`; then open the menu and pick an option, assert the placeholder replaces details.
- **Owning layer:** React/MUI UI (`src/ui/**`, `src/App.tsx`). No store changes, no new translation keys.
- **Stories:** use the `storybook-expert` skill for store seeding; all new stories set `a11y: { test: 'error' }`.
- **Tests:** `npm run test:react`, `npm run test:storybook`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#19](./19-bicycle-card-list-on-home.md), [#20](./20-store-selected-bicycle.md)
- **Blocks:** —
- **Risks/open questions:**
  - No way back to `home` from details except a reload; the menu only offers the four "Add/Before ride" screens.
    Accepted for this batch (design doc §8).

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Component and App tests written and passing
- [ ] Desktop, Mobile, and Dark stories added/updated and passing, with `a11y.test: 'error'`
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [ ] New `src/ui/**` files meet the coverage thresholds
- [ ] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Design: [docs/design/bicycle-card-list.md](../docs/design/bicycle-card-list.md)
- Related tickets: [#19](./19-bicycle-card-list-on-home.md), [#20](./20-store-selected-bicycle.md)
- PR(s): —
