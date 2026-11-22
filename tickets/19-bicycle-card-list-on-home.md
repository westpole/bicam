# [FEATURE] Show bicycles as a card list on the home screen

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #10)
> **Sprint:** `10-ui-introduce-bicycle-list`
> **Estimate:** M

---

## 1. Summary

Add a reusable `CardList` component and use it on the `home` screen to show every stored bicycle as a `Paper` card,
stacked vertically: a `DirectionsBike` avatar on the left, the bicycle name on row 1, and a reserved (empty) row 2 for
event icons (deferred, see the design doc §8.1). Cards are not clickable yet (#21).

---

## 2. Problem / Opportunity

- **Problem statement:** Bicycles can be stored (batch #8), but `home` is blank, so the user cannot see them.
- **Evidence:** `App.tsx` renders nothing for `activeScreen === 'home'`.
- **Success metric(s):** With a seeded store, `home` lists every bicycle in `allIds` order.

---

## 3. User Stories

### Story 1: See my bicycles on the start screen
**As a** rider
**I want to** see all my bicycles as cards when the app opens
**So that** I can find a bicycle at a glance

**Acceptance Criteria:**
- [ ] Given the store holds bicycles, when `home` is shown, then `<main>` contains a list named "Bicycles"
      (`home.bicycleList.label`) with one `<li>` card per bicycle, in `bicycle.allIds` order.
- [ ] Given a card, then it is an MUI `Paper` (elevation 1) showing a 56 × 56 rounded avatar with the `DirectionsBike`
      icon on the left and, on the right, the bicycle name (row 1) above an empty icon row that is 24px tall (row 2).
- [ ] Given a card, then its content sits in one flex container inside the `Paper`: a `Box` with `display: 'flex'`,
      `alignItems: 'center'`, `gap: 2`, `p: 2` (design doc §4.1). #21 replaces this `Box` with a `ButtonBase` that keeps
      the same styles, so the card looks identical before and after.
- [ ] Given several bicycles, then the cards are stacked vertically with a 12px gap (`spacing: 1.5`), each spanning the
      content width.
- [ ] Given more cards than fit, when the user scrolls, then `<main>` scrolls and the header stays put (existing shell
      behavior).
- [ ] Edge case: a 40-character name on the 320px `mobile1` viewport stays on one line with an ellipsis, and nothing
      overflows horizontally.
- [ ] Edge case: given no bicycles, then `home` renders nothing (no empty `<ul>`), so `<main>` looks exactly as it does
      today.
- [ ] Given a bicycle is added, renamed, or removed through the store, then the list updates without a reload.

**Out of scope:** clicking a card (#21); event icons (deferred to the `events` batch); an empty-state message; adding bicycles from the UI.

---

### Story 2: Reuse the card list elsewhere
**As a** developer
**I want to** a domain-agnostic `CardList` component
**So that** components, clothes sets, and other entities can use the same card layout later

**Acceptance Criteria:**
- [ ] Given `CardList` with `items: { id, title, media }[]`, then it renders a `<ul>` (`Stack component="ul"`,
      no bullets, no margin/padding) of `Paper component="li"` cards in item order.
- [ ] Given an item's `media`, then it is rendered in an `aria-hidden` slot on the left that does not shrink.
- [ ] Given an `aria-label` prop, then it is set on the `<ul>`.
- [ ] `CardList` does not import anything from `src/store/**` or bicycle-specific code.
- [ ] Props and item types are generic over the id type (`CardListItem<Id extends string = string>`), matching
      `VerticalList`.

**Out of scope:** click handling (#21). Do not declare an `icons` field yet; it would be unused (design doc §4.1).

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design doc | [docs/design/bicycle-card-list.md](../docs/design/bicycle-card-list.md) §2.1–2.3, §4.1–4.3, §6 | Wireframes, card anatomy, `CardList` / `Home` / `BicycleAvatar` specs, dependency rules |
| Existing similar component | `src/ui/components/VerticalList/` | Generic id typing, JSDoc style, story layout (Desktop / Mobile / Dark) |
| Existing screen pattern | `src/ui/components/screens/` | Folder layout and story padding (`p: { xs: 2, sm: 3 }`) |

Text fallback for the wireframes:
- Each card: rounded square teal avatar with a white bike icon on the left; the name in `subtitle1` to its right; a
  blank 24px line below the name.
- Cards are full-width rounded `Paper` blocks with a soft shadow, separated by 12px.

---

## 5. Technical Notes / Implementation Guidance

- **Dependency (do first, own commit inside this ticket is fine):** `npm install @mui/icons-material@^9` (same major as
  `@mui/material ^9.5.0`), as a runtime dependency. Confirm no other package version changes in `package-lock.json`.
  Import by path: `import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'`. See the exception in
  [plan.md](./plan.md#exceptions).
- **Affected files:**
  - New `src/ui/components/CardList/` — `CardList.tsx`, `types.ts`, `CardList.test.tsx`, `CardList.stories.tsx`.
  - New `src/ui/components/screens/Home/` — `Home.tsx`, `BicycleAvatar.tsx`, `types.ts`, `Home.test.tsx`,
    `Home.stories.tsx`.
  - `src/App.tsx` — select `state.bicycle` (one atomic selector), derive `bicycles` with `useMemo` from `allIds`, render
    `<Home bicycles={bicycles} />` when `activeScreen === 'home'`. Update the component JSDoc, which says `<main>` is
    "empty on `home`".
  - `src/ui/components/screens/constants.ts` — update the `SCREEN_COMPONENTS` JSDoc: `home` has no entry because `App`
    renders `Home` with props, not because the start screen is empty.
  - `src/i18n/locales/en/translation.json` — `home.bicycleList.label` = "Bicycles".
  - `src/__tests__/App.test.tsx`, `src/App.stories.tsx` — seeded-store case.
- **Owning layers:** React/MUI UI (`src/ui/**`, `src/App.tsx`), translations (`src/i18n/**`). No store changes.
- **Store reading:** keep `App` the only store reader. Do not write a selector that maps `allIds` to a new array (see
  [docs/store/README.md](../docs/store/README.md) §2).
- **Stories:** use the `storybook-expert` skill to seed bicycles (`useAppStore.setState` / `addBicycle` in a decorator,
  `reset()` afterwards). Stories: `CardList` Desktop / Mobile (`mobile1`) / Dark / LongTitle; `Home` WithBicycles /
  ManyBicycles / Empty; App `HomeWithBicycles`. All set `a11y: { test: 'error' }`.
- **Tests:** `npm run test:react` (CardList, Home, App), then `npm run test:storybook`.
- **Non-functional:** WCAG AA contrast in both schemes; no horizontal overflow at 320px; all text through `t()` (the
  bicycle name is user data and is rendered as is).

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** [#21](./21-open-bicycle-details-from-card.md)
- **Risks/open questions:**
  - Bundle/dev-server cost of `@mui/icons-material` — mitigated by path imports.
  - Empty-state message deferred (design doc §8); confirm the e2e visual baselines are untouched.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (`npm run test:react`)
- [ ] Desktop, Mobile, and Dark stories added and passing (`npm run test:storybook`), with `a11y.test: 'error'`
- [ ] `npm run typecheck` and `npm run lint` pass
- [ ] New `src/ui/**` files meet the coverage thresholds
- [ ] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Design: [docs/design/bicycle-card-list.md](../docs/design/bicycle-card-list.md)
- Related tickets: [#20](./20-store-selected-bicycle.md), [#21](./21-open-bicycle-details-from-card.md)
- PR(s): —
