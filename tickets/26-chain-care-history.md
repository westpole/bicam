# [FEATURE] Record chain lubrication and stretch

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #15)
> **Sprint:** `15-store-component-entity`
> **Estimate:** S

---

## 1. Summary

Let a chain's history entry hold the date it was waxed or lubricated and its measured stretch.

---

## 2. Problem / Opportunity

- **Problem statement:** Chains need regular care and wear out; without dates and readings a rider cannot tell when to
  wax or replace one.
- **Evidence:** [components.md §2.2–§3](../docs/store/components.md#22-componenthistoryentry).
- **Success metric(s):** A chain entry can hold both values, and no other type can.

---

## 3. User Stories

### Story 1: Record waxing or lubrication
**As a** rider
**I want to** log when I waxed or lubricated a chain
**So that** I know when it is due again

**Acceptance Criteria:**
- [ ] Entries have `lubricated`, `null` by default.
- [ ] On a `chain`, a real `YYYY-MM-DD` date is accepted, also before `installed`; another value → `invalidFormat`.
- [ ] Given a chain entry, adding a second one with the same `installed` and a later `date` and `lubricated` keeps
      both.
- [ ] For each of the other 15 types any non-null `lubricated` → `notAllowed`.

**Out of scope:** reminders, telling wax from lubricant.

### Story 2: Record stretch
**As a** rider
**I want to** log the stretch I measured
**So that** I replace the chain before it wears the cassette

**Acceptance Criteria:**
- [ ] Entries have `stretch`, `null` by default.
- [ ] On a `chain`, `0`, `0.5`, `0.75`, and `5` are accepted; below 0 or above 5 → `outOfRange`; `NaN`, `Infinity`, or
      more than two decimals (`0.755`) → `invalidFormat`.
- [ ] `-0` is stored as `0`.
- [ ] For each of the other 15 types any non-null `stretch`, including `0` → `notAllowed`.

**Out of scope:** replacement thresholds and warnings.

### Story 3: Type change respects chain data
**As a** rider
**I want to** keep chain data on chains only
**So that** stored entries always make sense

**Acceptance Criteria:**
- [ ] Given a chain with a `lubricated` or `stretch` value, changing its type returns
      `{ field: 'type', code: 'notAllowed' }` and state is unchanged.

**Out of scope:** clearing the values automatically.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [components.md §2.2, §3](../docs/store/components.md#22-componenthistoryentry) | Limits, chain-only rule |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/components/`.
- **Files:** `types.ts`, `constants.ts` (`CHAIN_CARE_TYPES`, stretch limits),
  `utilities/{normalizeComponentHistoryInput,validateComponentHistoryEntry}.ts`, tests.
- Reuse `isIsoDate` and `checkNumber`. Story 3 needs only a test: #25 added the guard.
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#25](./25-history-position-subcomponent.md)
- **Blocks:** [#27](./27-edit-remove-history-entry.md)
- **Risks/open questions:** None. Decisions are in [components.md §6](../docs/store/components.md#6-decisions).

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Store tests passing (`npm run test:store`); 90% branch threshold met
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [ ] JSDoc on every function and type; store docs match the code
- [ ] `code-reviewer` subagent run and findings addressed

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#25](./25-history-position-subcomponent.md), [#27](./27-edit-remove-history-entry.md)
- Design file: [docs/store/components.md](../docs/store/components.md)
