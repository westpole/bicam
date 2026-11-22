# [FEATURE] Add bicycle input normalization and validation utilities

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (#8)
> **Sprint:** `8-store-bicycle-entity`
> **Owner (PM):** Stanislav Spuzyak
> **Engineering lead:** Stanislav Spuzyak
> **Estimate:** S

---

## 1. Summary

Add pure functions that turn a `BicycleInput` into a normalized `Bicycle` and report every field that breaks the
documented limits, so store actions (#18) can reject invalid data.

---

## 2. Problem / Opportunity

- **Problem statement:** Bicycle data is typed by users (id, size such as `ML` or `51`, dates). Without one shared
  validator the limits would be re-implemented in each form and could drift from the docs.
- **Evidence:** [docs/store/bicycle.md §2–§5](../docs/store/bicycle.md#2-fields-and-limits).
- **Success metric(s):** Every rule in the limits table has a passing unit test.

---

## 3. User Stories

### Story 1: Normalize input
**As a** developer
**I want to** normalize raw form input into the stored shape
**So that** stored data never has stray whitespace, empty strings, or missing lists

**Acceptance Criteria:**
- [ ] Every string, including each component id, is trimmed.
- [ ] Optional text (`purchased`, `size`, `frameGeometry`) that is missing, `null`, or empty after trimming becomes `null`.
- [ ] A missing `components` list becomes `[]`.
- [ ] The input object is not mutated.

**Out of scope:** Changing case, removing duplicate components, adding units.

### Story 2: Validate a bicycle
**As a** developer
**I want to** get a list of `{ field, code }` errors for a normalized bicycle
**So that** a form can mark every invalid field at once

**Acceptance Criteria:**
- [ ] A valid bicycle returns `[]`.
- [ ] `id`, `company`, `model`: empty → `required`; over 40/60/60 chars → `tooLong`; control characters → `invalidFormat`.
- [ ] `purchased`: not `YYYY-MM-DD` or not a real date (`2023-02-30`, `2023-13-01`) → `invalidFormat`; leap days
  (`2024-02-29`) are accepted, `2023-02-29` is not.
- [ ] `size`: `'ML'`, `'M/L'`, `'51'`, `'56.5'`, `'S-M'` pass; over 10 chars → `tooLong`; other characters → `invalidFormat`.
- [ ] `frameGeometry`: over 500 chars → `tooLong`; line breaks allowed, other control characters → `invalidFormat`.
- [ ] `components`: over 100 ids → `tooMany`; an empty id → `required`; an id over 64 chars → `tooLong`; control
  characters → `invalidFormat`; a repeated id → `duplicate`.
- [ ] At most one error per field, in `Bicycle` field order.
- [ ] Edge case: limits apply after trimming (a 40-char id with surrounding spaces passes).

**Out of scope:** Id uniqueness across the store and unknown ids (both in #18), checking components against the
`components` slice, rejecting future dates.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Limits table | [docs/store/bicycle.md §2](../docs/store/bicycle.md#2-fields-and-limits) | Every rule |
| Error codes | [docs/store/bicycle.md §5](../docs/store/bicycle.md#5-results-and-error-codes) | Code meanings |

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand store helpers, `src/store/bicycle/`.
- **Files:** `src/store/bicycle/constants.ts` (`BICYCLE_LIMITS`, patterns), `src/store/bicycle/types.ts`
  (`BicycleInput`, `BicycleUpdate`, `BicycleField`, `BicycleErrorCode`, `BicycleValidationError`, `BicycleResult`),
  `src/store/bicycle/utilities/{isIsoDate,normalizeBicycleInput,validateBicycle}.ts` (one function per file),
  tests in `src/store/bicycle/__tests__/`.
- Pure functions, no store access. Full JSDoc per the `file-organization` skill.
- **Test lane:** `npm run test:store`.

---

## 6. Dependencies & Risks

- **Blocked by:** #16
- **Blocks:** #18
- **Risks/open questions:** None; limits are fixed in the docs.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (`npm run test:store`)
- [ ] JSDoc on every function

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#16](./16-store-root-structure.md), [#18](./18-bicycle-actions.md)
- Design file: [docs/store/bicycle.md](../docs/store/bicycle.md)
