# [FEATURE] Show and delete chain care entries

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** [plan.md](./plan.md) (batch #24)
> **Sprint:** `24-ui-implement-add-component-screen`
> **Estimate:** S

---

## 1. Summary

Add a dialog on chain rows that lists care entries, newest first, and can delete one.

---

## 2. Problem / Opportunity

- **Problem statement:** A mistyped stretch, or care logged at a wrong odometer reading, cannot be corrected and hides
  when care is due.
- **Evidence:** Entries store their distance, so lowering the odometer does not change them ([Rules](./plan.md#rules)).
- **Success metric(s):** After a wrong entry is deleted, the chain row shows the values from before it.

---

## 3. User Stories

### Story 1: See and delete care entries
**As a** rider
**I want to** see a chain's care entries and delete a wrong one
**So that** the next care is due at the right distance

**Acceptance Criteria:**
- [ ] **Care history** shows on chain rows. Without entries, a short message shows.
- [ ] Entries are sorted by date, newest first; on equal dates, the last one added comes first. Each shows what was
      done, lubricant, stretch, distance, and date. Unknown values read "Not specified".
- [ ] **Delete** asks first, then removes the entry. The row behind the dialog updates.
- [ ] After a deletion, focus stays in the dialog, on the next entry's button or the close button.
- [ ] Many entries scroll inside the dialog, also on phones.

**Out of scope:** editing an entry, other component types.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Design | [plan.md, Screens](./plan.md#screens) | Care history dialog |
| Existing store action | `removeComponentHistoryEntry` | Deleting one entry |

No mockups; follow the existing screens and the MUI theme.

---

## 5. Technical Notes / Implementation Guidance

- **Owning layers:** UI `BicycleDetails`, `App.tsx`; translations. No store change.
- Sort with the same tie rule as `getComponentUsage`.
- `bicycle-details-*` snapshots change.
- **Docs:** [bicycle-details.md](../docs/design/bicycle-details.md).
- **Test lanes:** `npm run test:react`, `npm run test:storybook`, visual e2e in Docker. Stories on desktop and mobile.

---

## 6. Dependencies & Risks

- **Blocked by:** [#37](./37-log-chain-care.md)
- **Blocks:** —
- **Risks/open questions:** None.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] React tests passing; desktop and mobile stories added or updated, with the a11y check passing
- [ ] All new text goes through `t()`, with keys in the English file
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:all` pass
- [ ] JSDoc on every function and type; docs updated
- [ ] `code-reviewer` subagent run and findings addressed
- [ ] Committed on `24-ui-implement-add-component-screen` as `feat: #24 <description> (ticket 39)`

---

## 8. Links

- Parent epic: [plan.md](./plan.md)
- Related tickets: [#37](./37-log-chain-care.md)
- Design: [plan.md, Design](./plan.md#design)
