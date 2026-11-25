# [FEATURE] Save the version 2 shape and migrate version 1

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** M

---

## 1. Summary

Add the odometer, usage periods, labels, starting distance, limits, lubricant, and cleaning date to the stored entities,
and upgrade saved version 1 data. The whole shape lands here, so the batch has one migration.

---

## 2. Problem / Opportunity

- **Problem statement:** The saved shape cannot express which component is in use, how far it was ridden, or what a
  chain was lubricated with.
- **Evidence:** `migratePersistedState` always throws, so any shape change without a migration starts the user's app
  empty.
- **Success metric(s):** Every version 1 fixture loads as version 2 with all bicycles, components, and history entries
  kept.

---

## 3. User Stories

### Story 1: Keep my data after an update
**As a** rider
**I want to** open the new version with my saved data
**So that** I do not enter it again

**Acceptance Criteria:**
- [ ] Bicycles, components, and history entries get the values in [Migration from version
      1](./plan.md#migration-from-version-1).
- [ ] `initialDistance` is taken from the newest whole-component entry that has a distance. Subcomponent entries are
      ignored; without such an entry it is 0.
- [ ] Assigned components start in use at odometer 0 with date `null`, unless their type has more components on the
      bicycle than `ACTIVE_LIMITS` allows; then none of that type starts in use. Spare components have no usage.
- [ ] Fixtures: empty app, one chain, three chains, two tires, three tires, a spare, and history entries.
- [ ] Version 1 data with a broken shape, and any other unknown version, still fails, is backed up, and starts empty.
- [ ] Loaded version 2 data is checked for types, formats, and option codes; that bicycles list stored components; and
      that an open period's bicycle exists and lists its component, with at most one open period per component ([rule
      1](./plan.md#rules)).
- [ ] Not checked: `replacedPeriodId` (a string or `null`, never looked up), the bicycle of a closed period or of
      `retired`, field limits, `ACTIVE_LIMITS`, overlaps, and chain-only limits. Tests load data with an unknown
      `replacedPeriodId` and with a removed bicycle in a closed period.

**Out of scope:** downgrading version 2 data.

---

### Story 2: Keep the new fields on every edit
**As a** developer
**I want to** have every action carry the new fields
**So that** an edit never erases them

**Acceptance Criteria:**
- [ ] New bicycles start with `odometer: 0` and `odometerDate: null`. New components start with `label: null`,
      `initialDistance: 0`, `usage: []`, `retired: null`, and the default limits of their type.
- [ ] `updateBicycle` keeps the odometer fields, and `updateComponent` keeps `label`, `initialDistance`, `limits`,
      `usage`, and `retired`. Such keys in their input are ignored for now.
- [ ] `updateComponent` rejects a new type with `{ field: 'type', code: 'notAllowed' }` once the component has usage
      periods. Otherwise a type change applies the default limits of the new type.

**Out of scope:** writing `label`, `initialDistance`, and `limits` (#30) and the odometer (#31).

---

### Story 3: Record lubricant and cleaning
**As a** developer
**I want to** write `lubricant` and `cleaned` on chain history entries
**So that** the care dialog can use them

**Acceptance Criteria:**
- [ ] `addComponentHistoryEntry` and `updateComponentHistoryEntry` accept both fields; blank text becomes `null`.
- [ ] On a type outside `CHAIN_CARE_TYPES`, either field is `notAllowed`.
- [ ] `lubricant`: any value other than `oil` or `wax` is `invalidOption`; without `lubricated` it is `notAllowed`.
- [ ] `cleaned`: a date that is not real is `invalidFormat`; without `lubricated`, `lubricated` is `required`; a date
      other than `lubricated` is `notAllowed`.
- [ ] `lubricated` without `lubricant` is accepted (unknown).
- [ ] Clearing only `lubricated` on an entry with `lubricant` or `cleaned` fails. Clearing all three in one call works.
- [ ] `distance` is accepted up to 1 000 000.

**Out of scope:** any UI.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Shape and limits | [plan.md, Data](./plan.md#data-saved-data-version-2) | Types, limits, error field names |
| Migration | [plan.md](./plan.md#migration-from-version-1) | Values for old data |
| Existing pattern | `src/store/persistence/` | Version, migrate, merge, shape checks |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/**`.
- **Prerequisite:** `src/store/persistence/` comes with #23. Merge `master` into the batch branch once #23 is there.
- **Files:** `src/store/{bicycle,components,persistence}/**`. `ACTIVE_LIMITS`, the default limits, and the raised
  `COMPONENT_LIMITS.distanceMax` go in `src/store/components/constants.ts`.
- `updateBicycle` and `updateComponent` rebuild the entity from its known fields today; carry the new ones over from the
  stored object.
- `BicycleDetails` leaves out the odometer fields; `ComponentDetails` leaves out `usage` and `retired`, and
  `ComponentField` leaves out `history`, `usage`, and `retired`.
- `NormalizedComponentHistoryInput` must also leave out `lubricant`, so it is `string | null` until it is checked.
- `migratePersistedState` returns data; `mergePersistedState` already checks the result.
- Update mocks, stories, and e2e seeds that build bicycles or components.
- **Docs:** [store README](../docs/store/README.md) §4, [bicycle.md](../docs/store/bicycle.md), and
  [components.md](../docs/store/components.md), including its statement that components do not refer back to bicycles.
- **Skill:** `zustand-unit-tests`.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** [#30](./30-add-spare-component.md), [#31](./31-record-bicycle-distance.md),
  [#32](./32-start-stop-swap-components.md)
- **Risks/open questions:** A wrong migration can hide user data. Version 1 text that fails to migrate is backed up, as
  today.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Store tests passing; 90% branch threshold met
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [ ] JSDoc on every function and type; docs updated
- [ ] `code-reviewer` subagent run and findings addressed
- [ ] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 29)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#30](./30-add-spare-component.md), [#31](./31-record-bicycle-distance.md),
  [#32](./32-start-stop-swap-components.md)
- Design: [plan.md, Design](./plan.md#design)
