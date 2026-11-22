# [FEATURE] Add placeholder screens for the four menu options

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** [plan.md](./plan.md) (#6)
> **Sprint:** `6-menu-introduce-and-set-placeholders`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Create a placeholder component for each menu option (Add bicycle, Add component, Add clothes set, Before ride
check-in), built on a shared `ScreenPlaceholder`, plus a `SCREEN_COMPONENTS` map from screen id to component.

---

## 2. Problem / Opportunity

- **Problem statement:** Menu options need a destination before the real forms exist.
- **Evidence:** Requirement "create Components placeholders for each menu option"; [design §4.6](../docs/design/app-menu.md#46-placeholder-screens-srcuicomponentsscreens).
- **Success metric(s):** Each option shows a distinct, titled screen.

---

## 3. User Stories

### Story 1: Placeholder per option
**As a** user
**I want to** land on a titled screen after choosing a menu option
**So that** I know the option worked even before the feature is built

**Acceptance Criteria:**
- [ ] `AddBicycle`, `AddComponent`, `AddClothesSet`, and `BeforeRideCheckIn` each render an `<h2>` with their translated title ("Add bicycle", "Add component", "Add clothes set", "Before ride check-in") and the text "This screen is coming soon."
- [ ] `ScreenPlaceholder` renders the given `title` as `h2` (`variant="h5"`) and the body in `text.secondary`.
- [ ] `SCREEN_COMPONENTS` has exactly one entry per `MenuScreen` and none for `home`.
- [ ] Edge case: a long title wraps instead of overflowing at `mobile1` (320px).

**Out of scope:** Forms, data, navigation back to home.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design spec | [docs/design/app-menu.md §4.6](../docs/design/app-menu.md#46-placeholder-screens-srcuicomponentsscreens) | Ids, components, keys |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** React/MUI UI, `src/ui/components/screens/` (`ScreenPlaceholder/`, `AddBicycle/`, `AddComponent/`, `AddClothesSet/`, `BeforeRideCheckIn/`, `constants.ts`).
- `SCREEN_COMPONENTS: Record<MenuScreen, ComponentType>` typed with `MenuScreen` from `@store/types` (#10).
- Translations: `screens.<id>.title` ×4 and `screens.placeholder.body`.
- One test file covering all four screens plus the map; one stories file (`Screens/Placeholders`) with Desktop, Mobile, and Dark stories per screen via `args`.
- **Test lanes:** `npm run test:react`, `npm run test:storybook`.

---

## 6. Dependencies & Risks

- **Blocked by:** #10
- **Blocks:** #15
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests and stories written and passing
- [ ] Accessibility check passed (Storybook a11y `error`)

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#10](./10-app-store-menu-state.md), [#15](./15-wire-menu-into-app.md)
- Design file: [docs/design/app-menu.md](../docs/design/app-menu.md)
