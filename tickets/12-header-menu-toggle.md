# [FEATURE] Toggle the header menu icon to `X` when the menu is open

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

Add a local `CloseIcon` and a `menuOpen` prop to `AppHeader` so the menu button shows ✕ ("Close menu") while the menu
is open and ≡ ("Open menu") while it is closed, with disclosure ARIA attributes.

---

## 2. Problem / Opportunity

- **Problem statement:** Users need to see that the menu is open and how to close it.
- **Evidence:** Requirement "toggle menu icon to `X` icon when open"; [design §4.2–4.3](../docs/design/app-menu.md#42-closeicon-srcuicomponentsiconscloseicontsx).
- **Success metric(s):** The button's icon, label, and `aria-expanded` always match the menu state.

---

## 3. User Stories

### Story 1: Close icon
**As a** user
**I want to** see an ✕ on the menu button while the menu is open
**So that** I know a click closes it

**Acceptance Criteria:**
- [ ] `CloseIcon` renders a decorative inline 24 × 24 SVG with the path from the design doc, filled with `currentColor`.
- [ ] Given `menuOpen` is `true`, then the button shows `CloseIcon`, is named "Close menu", and has `aria-expanded="true"`.
- [ ] Given `menuOpen` is `false` or omitted, then the button shows `MenuIcon`, is named "Open menu", and has `aria-expanded="false"`.
- [ ] In both states the button has `aria-controls="app-menu"` and keeps its 48 × 48 hit area; `onMenuClick` still fires.

**Out of scope:** The menu itself, animating the icon swap, reading the store inside the header.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design spec | [docs/design/app-menu.md §4.2–4.3](../docs/design/app-menu.md#43-appheader-changes) | State table |
| Existing similar component | `src/ui/components/icons/MenuIcon.tsx` | `createSvgIcon` pattern, tests, stories |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** React/MUI UI: `src/ui/components/icons/CloseIcon.tsx` (+ test, story), `src/ui/components/AppHeader/` (props, component, tests, stories).
- Translations: add `header.menuButton.closeLabel` = "Close menu" to `src/i18n/locales/en/translation.json`.
- Menu id `app-menu` lives in `src/ui/components/AppMenu/constants.ts` as `APP_MENU_ID`; create that file here if #14 has not.
- Stories: add `MenuOpen` (desktop) and `MenuOpenMobile` and `MenuOpenDark` to `AppHeader.stories.tsx`; keep the existing ones.
- **Test lanes:** `npm run test:react`, `npm run test:storybook`.

---

## 6. Dependencies & Risks

- **Blocked by:** —
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
- Related tickets: [#15](./15-wire-menu-into-app.md)
- Design file: [docs/design/app-menu.md](../docs/design/app-menu.md)
