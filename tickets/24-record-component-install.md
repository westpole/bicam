# [FEATURE] Record an installation and distance in component history

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [plan.md](./plan.md) (batch #15)
> **Sprint:** `15-store-component-entity`
> **Estimate:** M

---

## 1. Summary

Add `addComponentHistoryEntry`, so a caller can add a dated record of when a component of any type was installed and
how far it was ridden.

---

## 2. Problem / Opportunity

- **Problem statement:** A component's `history` is always empty, so the app cannot answer "how old is this part?"
- **Evidence:** [components.md §2.2](../docs/store/components.md#22-componenthistoryentry).
- **Success metric(s):** An entry with a record date, an install date, and a distance can be added to a component of every type.

---

## 3. User Stories

### Story 1: Record an installation
**As a** rider
**I want to** log the install date and distance of a part
**So that** I know its age and wear

**Acceptance Criteria:**
- [x] `ComponentHistoryEntry` has `id`, `date`, `installed`, and `distance`.
- [x] Two entries with the same `installed` and different `date` and `distance` are both kept. `date` may be before,
      equal to, or after `installed`.
- [x] Given a stored component and valid input, the action returns `{ ok: true, entry }` with a UUID v4 `id`, and the
      entry is appended to that component's `history`. Other components keep their references.
- [x] A missing or `null` `distance` is stored as `null`; `0` is stored as `0`; `-0` is stored as `0`.
- [x] Entries keep insertion order even when their dates are out of order; two entries may share every value except `id`.
- [x] The resulting state survives `JSON.parse(JSON.stringify(state))` unchanged.

**Out of scope:** `position` and `subcomponent` (#25), `lubricated` and `stretch` (#26), computing distance from rides.

### Story 2: Reject an invalid entry
**As a** developer
**I want to** get every failing field as a code
**So that** a form can mark them all at once

**Acceptance Criteria:**
- [x] `date` and `installed`: blank → `required`; not a real `YYYY-MM-DD` date (`2023-02-30`) → `invalidFormat`.
- [x] `distance`: `NaN` or `Infinity` → `invalidFormat`; below 0 or above 500 000 → `outOfRange`; more than one decimal
      (`412.55`) → `invalidFormat`.
- [x] Several failing fields return one error each, in the order `date`, `installed`, `distance`.
- [x] An unknown component → only `{ field: 'componentId', code: 'notFound' }`, also for `'__proto__'` and when the
      input is invalid too.
- [x] A component with 500 entries → only `{ field: 'history', code: 'tooMany' }`, also when the input is invalid too.
- [x] On failure no id is generated and `components` keeps the same object reference.

**Out of scope:** rejecting future dates.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [components.md §2.2, §4, §5](../docs/store/components.md#22-componenthistoryentry) | Fields, normalization, codes |
| Existing pattern | `src/store/bicycle/utilities/` | Normalize, then validate |

No visual assets (store-only ticket).

---

## 5. Technical Notes / Implementation Guidance

- **Owning layer:** Zustand, `src/store/components/`.
- **Files:** `types.ts` (extend `ComponentActions`), `constants.ts` (`COMPONENT_LIMITS`), `createComponentsSlice.ts`,
  `utilities/{createHistoryEntryId,normalizeComponentHistoryInput,validateComponentHistoryEntry,checkNumber}.ts`, tests.
- `validateComponentHistoryEntry(type, entry)` takes the component type from the start; #25 and #26 add rules that
  use it.
- `checkNumber(value, max, decimals)` checks finite, then range, then decimals. Compare
  `Number(value.toFixed(decimals)) === value`; multiplying by a power of ten gives wrong results for some decimals.
- **Shared code:** move `isIsoDate` (with its test), `ISO_DATE_PATTERN`, `IsoDate`, and `toOptionalText` to
  `src/store/common/`.
- **Test lane:** `npm run test:store`, then `npm run test:all`.

---

## 6. Dependencies & Risks

- **Blocked by:** [#23](./23-edit-remove-component.md)
- **Blocks:** [#25](./25-history-position-subcomponent.md)
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
- Related tickets: [#25](./25-history-position-subcomponent.md), [#26](./26-chain-care-history.md), [#27](./27-edit-remove-history-entry.md)
- Design file: [docs/store/components.md](../docs/store/components.md)
