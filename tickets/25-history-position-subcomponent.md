# [FEATURE] Record position and subcomponent

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #15)
> **Sprint:** `15-store-component-entity`
> **Estimate:** M

---

## 1. Summary

Let a history entry say which end of the bicycle (`position`) and which part of the component (`subcomponent`) it is
about, for the types that have them.

---

## 2. Problem / Opportunity

- **Problem statement:** "Brake pads replaced" is useless without knowing which brake and that it was the pads.
- **Evidence:** [components.md §3](../docs/store/components.md#3-type-specific-history-fields).
- **Success metric(s):** Every cell for `position` and `subcomponent` in the §3 table has a passing test.

---

## 3. User Stories

### Story 1: Record the position
**As a** rider
**I want to** mark an entry as front or rear
**So that** I can tell my two brakes, shifters, or derailleurs apart

**Acceptance Criteria:**
- [x] Entries have `position`, `null` by default.
- [x] `'front'` and `'rear'` are accepted for `brakes`, `shifters`, and `derailleur`; another value → `invalidOption`.
- [x] For each of the other 13 types any non-null `position` → `notAllowed`.
- [x] Missing, `null`, or blank is stored as `null` for every type.

**Out of scope:** left and right (pedals, crank arms).

### Story 2: Record the subcomponent
**As a** rider
**I want to** name the part that was replaced
**So that** I know which part of a wheel, brake, or shifter is new

**Acceptance Criteria:**
- [x] Entries have `subcomponent`, `null` by default.
- [x] `wheel` accepts `hub`, `spokes`, `rim`, `valve`; `brakes` accepts `lever`, `hose`, `caliper`, `rotor`,
      `brakePads`, `brakeFluid`; `shifters` accepts `shifter`, `hose`, `cable`, `derailleur`.
- [x] On those types another value → `invalidOption`, including a value of another type (`rim` on `brakes`).
- [x] For each of the other 13 types any non-null `subcomponent` → `notAllowed`.

**Out of scope:** a separate model or distance per subcomponent.

### Story 3: Keep history valid when the type changes
**As a** rider
**I want to** be stopped from changing a type that does not fit its history
**So that** stored entries always make sense

**Acceptance Criteria:**
- [x] Given `brakes` with an entry `subcomponent: 'rotor'`, `updateComponent(id, { type: 'chain' })` returns
      `{ ok: false, errors: [{ field: 'type', code: 'notAllowed' }] }` and state is unchanged.
- [x] The result is the same single error when the entry itself would fail with another code: `brakes` with
      `subcomponent: 'rotor'` changed to `shifters` (`invalidOption` on the entry) → `notAllowed` on `type`.
- [x] When `model` is invalid too, both errors are returned, `type` first.
- [x] Given `brakes` whose entries use only `position` and `hose`, changing to `shifters` succeeds.
- [x] Changing only `model` never runs into this rule.

**Out of scope:** clearing conflicting fields automatically.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [components.md §3–§5](../docs/store/components.md#3-type-specific-history-fields) | Rule table and constants, codes |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/components/`.
- **Files:** `types.ts`, `constants.ts` (`POSITION_TYPES`, `SUBCOMPONENTS`),
  `utilities/{normalizeComponentHistoryInput,validateComponentHistoryEntry}.ts`, `createComponentsSlice.ts`, tests.
- Read the rules from the constants; do not branch on type names in the validator.
- Story 3 reuses `validateComponentHistoryEntry(newType, entry)` on each stored entry and turns any error into
  `notAllowed` on `type`, so #26's fields are covered without further work.
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#24](./24-record-component-install.md)
- **Blocks:** [#26](./26-chain-care-history.md)
- **Risks/open questions:** None. Decisions are in [components.md §6](../docs/store/components.md#6-decisions).

---

## 7. Definition of Done

- [x] All acceptance criteria met
- [x] Store tests passing (`npm run test:store`); 90% branch threshold met
- [x] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [x] JSDoc on every function and type; store docs match the code
- [x] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#24](./24-record-component-install.md), [#26](./26-chain-care-history.md)
- Design file: [docs/store/components.md](../docs/store/components.md)
