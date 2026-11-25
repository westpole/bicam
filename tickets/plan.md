# Plan: Add component and track its usage

> **Process:** follow [README.md](./README.md) for how plans and tickets are generated.
> **Batch branch:** `24-ui-implement-add-component-screen` (exists, created from `master` at `4a3299f`)
> **Batch issue:** #24 (from the branch name; used in every commit message of this batch)
> **Batch status:** Ready for Dev. Starts when #23 is in `master` and merged into the batch branch.

## Goal

A rider can add a component from the menu, assign several of the same kind to a bicycle (for example three chains), use
one of them at a time, and see how far each one was ridden since it was installed and how worn it is. Done when the
[worked example](#worked-example) can be done in the app, survives a restart, and the checks in
[Definition of done](#definition-of-done) pass.

Telling the rider that service is due belongs to the later events manager. This batch gives it the data.

### Starting point

Verified on 2026-11-25 on branch `23-store-make-store-persistent` (commit `3cf325e`, not merged into `master`):

- **Add component** (`src/ui/components/screens/AddComponent/`) is a placeholder. A component can be created only in the
  bicycle details dialog, with a type and a model.
- `Bicycle.components` lists up to 100 ids. Nothing limits how many are of one type, so three chains already fit, but
  nothing says which one is in use. A component is on at most one bicycle, enforced by the store.
- A component's `history` can hold `distance`, `lubricated`, and `stretch`, with actions to write them. No UI uses them.
- There is no source of distance: bicycles have no odometer, and there are no rides.
- `ComponentList` is read-only. Spare components (on no bicycle) appear only in the include dialog.
- Two components of the same type and model look identical in every list.
- Saved data is version 1. `migratePersistedState` always throws, so a shape change without a migration starts the
  user's app empty (with a backup).
- `updateBicycle` and `updateComponent` rebuild the stored entity from its known fields, so a new field that they do not
  carry over is lost on the next edit.
- `removeComponent` and `addComponentToBicycle` write two slices with two `set` calls, and each one is saved.
- The batch branch does not contain #23 yet, so `src/store/persistence/` is missing there.
- Highest ticket number used: 28 (batch #15). This batch uses 29–40. They can overlap GitHub numbers, as in earlier
  batches, so commits name them as `(ticket <n>)` and never as `#<n>`.

| Requirement | Ticket |
| --- | --- |
| "Add component" screen | #30, #35 |
| Distance per component, counted from its installation | #31, #32, #33, #34 |
| Several chains assigned, one in use | #32, #35, #36 |
| Special characteristics (chain stretch, oil or wax, top-up, cleaning) | #30 (limits), #37 (readings) |
| Distance and stretch entered by hand for now | #31, #37 |
| Ready for the events manager | #29, #30 (limits), #34 (usage) |
| Correct a wrong swap, odometer, or care entry | #31, #38, #39 |
| Retire a worn-out component | #40 |

### What the workshop needs

How a mechanic works with rotated chains, and what it means for the app:

| In the workshop | In the app |
| --- | --- |
| A chain wears only while it runs. The ones on the hook do not. | Distance is credited to components **in use**, not to every assigned one. |
| A chain runs on oil or wax. | Each lubrication records which one. |
| Lubricant is topped up about every 300 km, on the bicycle. About every 1500 km the chain is cleaned and lubricated again. | Two separate intervals. A top-up restarts the first; a clean with relubrication restarts both. |
| Oil and wax do not mix: changing from one to the other needs a clean chain. | The care dialog warns when a top-up uses a different lubricant than the last one. It does not block. |
| A clean is a good moment to swap chains, so they wear evenly with the cassette. | Swapping is one action: the old one comes off and the new one goes on at the same odometer reading. It never happens by itself. |
| A part is replaced when it reaches its distance, or at the end of a season, so the bicycle's total says little about it. | Each component counts its own distance from the moment it is put on a bicycle. A swap can be made at any time. |
| Identical chains are told apart by a tag or a coloured quick link. | An optional `label` ("A", "red link"). |
| Swaps and chain care are often written down days late. | Both take the odometer reading at which they happened. |
| Stretch matters together with distance. | A stretch reading records the chain's distance at that moment. |
| Used parts come with kilometres on them. | A starting distance per component. |
| Wear limits depend on the drivetrain. | Limits are stored per component, with a suggested default that the rider can change. |

Suggested limits for `chain`: stretch **0.5 %**, lubrication every **300 km**, cleaning every **1500 km**, no distance
limit. The two intervals are the user's own and are the same for oil and wax. Park Tool advises replacing 11–13-speed
chains at 0.5 % and 5–10-speed chains at 0.75 %; the field's hint says so. No official figure was found for SRAM
flat-top chains (0.8 % is only anecdotal), so they get no special case. Other types have no defaults.

## Design

### Words

| Word | Meaning |
| --- | --- |
| Assigned | Listed in `Bicycle.components`. |
| In use | Has an open usage period. Only assigned components can be in use. |
| Resting | Assigned, not in use. |
| Retired | Taken off its bicycle for good, but can be restored. Keeps its distance and history. |
| Spare | On no bicycle (as today) and not retired. |
| Boundary | The `start` or `end` reading of a usage period. |

### Data (saved data version 2)

```ts
interface Bicycle {
  // ...existing fields
  odometer: number;                 // km; starts at 0
  odometerDate: IsoDate | null;     // date of that reading
}

interface OdometerReading { date: IsoDate | null; odometer: number } // null = unknown date

interface ComponentUsagePeriod {
  id: string;                       // UUID v4
  bicycleId: BicycleId;             // a closed period may name a removed bicycle
  start: OdometerReading;
  end: OdometerReading | null;      // null = in use now
  replacedPeriodId: string | null;  // the period that this start ended, for undo
}

interface ComponentLimits {
  distance: number | null;          // replace after, km
  stretch: number | null;           // replace at, %; chain only
  lubrication: number | null;       // top up every, km; chain only
  cleaning: number | null;          // clean and relubricate every, km; chain only
}

type Lubricant = 'oil' | 'wax';

interface ComponentHistoryEntry {
  // ...existing fields; `lubricated` stays the date of any lubrication
  lubricant: Lubricant | null;      // chain only; null = unknown
  cleaned: IsoDate | null;          // chain only
}

interface BicycleComponent {
  // ...existing fields
  label: string | null;             // not unique
  initialDistance: number;          // km before tracking; 0 for a new part
  limits: ComponentLimits;
  usage: ComponentUsagePeriod[];
  retired: { date: IsoDate; bicycleId: BicycleId } | null; // the bicycle it was retired from
}
```

| Field | Limits |
| --- | --- |
| `odometer`, `initialDistance` | 0–500 000, at most 1 decimal |
| `label` | 1–20 chars after trimming, no control characters; blank becomes `null` |
| `limits.distance`, `limits.lubrication`, `limits.cleaning` | Above 0, up to 500 000, at most 1 decimal |
| `limits.stretch` | Above 0, up to 5, at most 2 decimals |
| `usage` | Up to 500 periods |
| `lubricant` | `invalidOption` for other values; `notAllowed` without `lubricated` |
| `cleaned` | Real `YYYY-MM-DD` date. `lubricated` is then `required`, because a cleaned chain needs lubricant, and must be the same date, otherwise `notAllowed` on `cleaned` |
| History `distance` | `COMPONENT_LIMITS.distanceMax` rises from 500 000 to 1 000 000, so the total of a part that stayed on one bicycle always fits |

`BicycleDetails`, `BicycleInput`, and `BicycleUpdate` leave out the odometer fields; `ComponentDetails` leaves out
`usage` and `retired`. When `limits` or one of its keys is left out, `addComponent` applies the type's default and
`updateComponent` keeps the stored value; a type change starts from the new type's defaults. The error field names are
`label`, `initialDistance`, `limits.distance`, `limits.stretch`, `limits.lubrication`, and `limits.cleaning`. The new
history fields are `lubricant` and `cleaned`, and follow `CHAIN_CARE_TYPES`. Removing a lubrication with
`updateComponentHistoryEntry` means clearing `lubricated`, `lubricant`, and `cleaned` in one call.

The odometer belongs to the bicycle and is what the rider enters. A component's distance is its own: it starts when the
component is first put on a bicycle and grows only while it is in use. It is **derived, never stored**:

`distance = initialDistance + Σ ((period.end?.odometer ?? bicycle.odometer) − period.start.odometer)`

It is rounded to 1 decimal.

### How many can be in use

One table, `ACTIVE_LIMITS`, in `src/store/components/constants.ts`:

| Types | In use per bicycle |
| --- | --- |
| `wheel`, `tire`, `brakes`, `shifters`, `derailleur` | 2 |
| `frontMount` | No limit |
| All others, including `chain` and `cassette` | 1 |

### Rules

1. A component has at most one open period, and that period's bicycle lists the component. "In use" is never stored
   separately.
2. Adding a component through the form or the include dialog puts it in use, at the current odometer and today's date,
   when its type has room. Otherwise it rests. On the form, the rider can change the choice before saving. Ids added
   with `addBicycle` or `updateBicycle` rest.
3. Starting a component when its type is full requires naming the one it replaces. Naming one is also allowed when
   there is room. Both change in one `set`.
4. **Start** at reading `r`:
   - `r` is at or below the bicycle's odometer, at or above the component's own latest boundary on that bicycle, and at
     or above the start of the replaced period.
   - At no reading from `r` on are more periods of that type open on the bicycle than `ACTIVE_LIMITS` allows. This
     counts every component's periods on the bicycle, with the replaced period ended at `r`.

   The second check is exact for types with two in use: a late front-wheel swap does not block a later rear one. For a
   type with one, changes must be entered in order; undo the newer one first (rule 10).
5. **Stop** at reading `r`: between the period's own start and the bicycle's odometer.
6. The odometer cannot go below the latest boundary on that bicycle. This checks every period with that `bicycleId`,
   including those of spare components and of components that moved to another bicycle.
7. A period with zero length is dropped when it closes. A start at the reading where the component's last period on that
   bicycle ended reopens that period instead of adding one, unless it replaces a period that stays. A start that
   replaces a dropped period takes over its `replacedPeriodId`. So after C → B → D at one reading, undo brings back C:
   B never ran.
8. Taking a component off a bicycle (`updateBicycle`) or removing the bicycle closes its open period at the current
   odometer and odometer date (`null` when unknown). The component keeps its distance.
9. A component's type cannot change once it has usage periods, `initialDistance` cannot change once a whole-component
   history entry has a distance, and a type other than `chain` cannot have chain limits (`notAllowed`).
10. **Undo** removes the open period of a component in use. It reopens the period in `replacedPeriodId` when that is
    still its component's last period, its type has room, and the component rests on this bicycle or was retired from
    it. A retired component is restored in the same `set`, if the bicycle has room. Otherwise nothing takes its place,
    and the dialog says why. History entries stay, and the dialog warns when some of them then have a distance above the
    component's. The UI offers undo only for a start that replaced another component or that is the latest boundary on
    the bicycle, and never for a period without a start date (migrated).
11. Every action that writes both slices validates first, then writes them in one `set`. A failed action changes
    nothing, and no saved state breaks rule 1.
12. The store has no clock: the UI supplies today's date. Validation does not compare dates, except `cleaned` with
    `lubricated`; readings give the order of usage. Only `getComponentUsage` uses dates, to find the newest entry.
13. **Retire** closes the component's open period at the given reading, takes it off its bicycle, and stores when and
    from which bicycle. A retired component is not spare and cannot be assigned or started. A swap can retire the
    replaced component. **Restore** puts it back on that bicycle, resting, or makes it spare when that bicycle was
    removed.

A wrong odometer reading is corrected by setting a lower one. When rule 6 blocks that, the rider first undoes the starts
made at the wrong reading. A stop is undone by starting the component again at the same reading (rule 7). Care entries
logged at the wrong reading keep their distance, so the rider deletes them and logs them again (#39).

**Known limit:** when a component was taken off at a wrong reading and is now in use on another bicycle, the reading can
be corrected only after it returns.

Usage actions report these errors, in addition to the number and date format codes:

| Field | Code | Raised when |
| --- | --- | --- |
| `bicycleId`, `componentId` | `notFound` | Unknown id; returned alone |
| `componentId` | `notAllowed` | Start: not assigned to that bicycle, already in use, or retired. Stop and undo: not in use. Assign: retired. Retire: on no bicycle, or already retired. Restore: not retired |
| `replaces` | `required` | The type is full, or `retireReplaced` is set, and no component is named |
| `replaces` | `notAllowed` | The named component is not in use on that bicycle, or has another type |
| `odometer` | `outOfRange` | Rules 4, 5, and 6 (rule 6: `setBicycleOdometer`) |
| `odometer` | `required` | Retire: the component is in use and no reading is given |
| `components` | `tooMany` | Assign and restore: the bicycle is full |
| `components` | `notAllowed` | `addBicycle` and `updateBicycle`: a listed component is retired |
| `usage` | `tooMany` | The component already has 500 periods |

### History readings

Entries get `lubricant` and `cleaned`. A **top-up** sets `lubricated` and `lubricant`. A **clean and relubrication**
also sets `cleaned`. A **stretch** reading can stand alone or go with either. For entries about a whole component,
`distance` now means **the component's own distance as of `date`** (see [Data](#data-saved-data-version-2)), including
`initialDistance`. It is not the bicycle's odometer. For subcomponent entries
(brake pads, for example) it stays "since `installed`" and is not filled in, because the parent's distance is not the
part's.

The care dialog asks for the odometer when the chain is in use, so a late entry gets the distance of that moment:

- In use: `distance − (bicycle.odometer − reading)`, for a reading within the open period. A reading before the period's
  start is rejected, and the dialog asks for the distance instead.
- Resting: the current distance, with no odometer field.
- The distance stays editable, for care done before the latest swap. A filled-in value is capped at
  `COMPONENT_LIMITS.distanceMax`.

### Contract for the events manager

```ts
getComponentUsage(component, bicycles): {
  distance: number;                         // all its usage, plus the starting distance
  distanceSinceInstalled: number | null;    // in the open period; null when not in use
  isInUse: boolean;
  stretch: number | null;                   // newest reading
  lubricant: Lubricant | null;              // from the newest lubrication
  distanceSinceLubrication: number | null;  // top-up or clean; null when unknown
  distanceSinceCleaning: number | null;     // null when unknown
}
```

- `distanceSinceInstalled` tells how long the component has been on since the last swap.
- `stretch` comes from the entry with the latest `date` that has one; on equal dates, the last one added.
- `distanceSinceLubrication` uses the entry with the latest `lubricated` date, with the same tie rule. It is `null` when
  that entry has no distance, and never below 0. `lubricant` comes from the same entry.
- `distanceSinceCleaning` works the same way with `cleaned`. Top-ups do not change it.

A limit is reached when the value is at or above it. Together with `component.limits`, this is enough to decide that
service is due. The function is pure and takes no date. Nothing in this batch writes to `events`.

### Migration from version 1

- Bicycles get `odometer: 0`, `odometerDate: null`. Components get `label: null`, `usage: []`, and `retired: null`.
  Chains get the default chain limits; other types get empty limits. History entries get `lubricant: null` and
  `cleaned: null`.
- `initialDistance` is the distance of the newest whole-component history entry that has one (latest `date`, then the
  last one added), otherwise 0. No screen writes such entries yet, so it is 0 in practice.
- Assigned components start in use at odometer 0 with date `null`. The UI shows it as "Not specified".
- When a bicycle has more components of one type than fit, **none of them** starts in use. The app cannot know which
  chain is fitted, and a wrong guess would silently credit the wrong one. The details screen asks the rider to choose.
  The reading defaults to the current odometer and can be lowered to 0, so no distance is lost.

Loaded data is checked for types, formats, option codes, bicycles that list stored components, and rule 1.
`replacedPeriodId`, the bicycle of a closed period, and the bicycle in `retired` are not looked up, because they may
name something that was removed. As with today's field limits ([README.md §4](../docs/store/README.md#4-persistence)),
the check leaves out `ACTIVE_LIMITS`, period counts, overlaps, and chain-only limits, so tightening a rule never makes
saved data unreadable.

### Screens

- **Add component** (menu): type, model, label, starting distance, limits (chain fields only for chains), bicycle
  ("None" or one of the bicycles), and "In use now" when a bicycle is chosen. If the type is full there, the form asks
  which component to replace. Saved with a bicycle: opens that bicycle's details. Saved as spare: the form clears and a
  success message names the component, because no screen lists spares.
- **Bicycle details**: odometer with **Update distance** (set the total, or add a ride; the store gets the total). The
  component list gets two groups, **In use** and **Resting**, with label and distance; rows in use add the distance
  since installed. Chain rows add lubricant and stretch, lubrication, and cleaning against their limits. A resting row
  has **Use now**, a row in use has **Undo** when rule 10 offers it, and a chain row has **Log care** and **Care
  history**.
- **Swap dialog**: which component to replace (preselected when only one fits), date, odometer at the swap.
- **Undo**: asks first. It names the component that comes back, if any, and the distance that this one loses, because
  undoing an old start removes its whole period.
- **Log care dialog** (chain): what was done (measured only, topped up, or cleaned and relubricated), oil or wax (preset
  to the last one), stretch, date, odometer (when in use), distance.
- **Retire**: asks first, with the date and, when in use, the odometer. The swap dialog and the replacement choice on
  the form can retire the replaced component, and undoing such a swap brings it back. Bicycle details list retired
  components in a third group, with **Restore**.
- **Care history dialog** (chain): entries, newest first, each with **Delete**, which asks first.

The include dialog stays the quick path, with type and model only, and follows rule 2. Its spare options add the label
and the distance, so identical chains can be told apart.

### Worked example

Bicycle at 0 km, chains A, B, and C assigned, A in use, one cassette in use:

| Step | Chain A | Chain B | Chain C | Cassette |
| --- | --- | --- | --- | --- |
| Odometer set to 1500 | 1500 | 0 | 0 | 1500 |
| Swap A → B at 1500, odometer set to 3100 | 1500 | 1600 | 0 | 3100 |
| Odometer set to 4500, swap B → A entered late, at 3100 | 2900 | 1600 | 0 | 4500 |
| Undo that swap | 1500 | 3000 | 0 | 4500 |

"Since installed" after the third step: chain A 1400, cassette 4500.

Chain care over the first 1500 km, with chain A in use:

| Step | Since lubrication | Since cleaning |
| --- | --- | --- |
| Cleaned and waxed at 0, odometer set to 300 | 300 | 300 |
| Topped up with wax at 300, odometer set to 550 | 250 | 550 |
| Odometer set to 1500, cleaned and waxed at 1500 | 0 | 0 |

Both tables are store tests (#34), without the undo step, which #38 adds. The first three usage steps are also the e2e
flow (#36), and #37 adds the care steps to it.

### Later: rides from Garmin and Zwift

Distance and stretch are entered by hand in this batch. Ride import comes later and should raise the odometer, so usage
periods and swaps stay as they are. What that batch has to solve:

- **Zwift is normally ridden on a different bicycle, but that changes from time to time.** Each imported ride needs a
  bicycle: suggest the usual one per source, and let the rider change it per ride. A bicycle used only indoors works
  today, with its own odometer and components.
- **Indoor rides wear fewer parts.** On a direct-drive trainer the chain wears, but the wheels, tires, and brakes do
  not, and the cassette in use is the trainer's. One odometer cannot tell this apart. A second, indoor odometer on the
  bicycle and on every reading can be added by a migration that sets it to 0, so nothing is needed now.
- **Until then,** indoor kilometres added to the odometer of a bicycle that is also ridden outside count for its
  wheels, tires, brakes, and cassette too.
- **The same ride can arrive twice,** because Zwift rides can also appear in Garmin Connect. Imports need an id per
  ride.
- Stretch is not in any ride log, so it stays a manual reading.

### Decisions

Confirmed by the user on 2026-11-25, except where a row says "assumed":

| Decision | Reason |
| --- | --- |
| The bicycle odometer is the distance source. The rider enters the total or adds a ride, by hand for now. | One number per bicycle covers every component on it, and a ride import can raise it later. |
| A component's distance is its own, counted from its installation, not the bicycle's total. | Parts are replaced at their own distance or at the end of a season. |
| In-use limits as above; two wheels or tires are not told apart by position. | Keeps the earlier decision that they have no position. |
| Chain defaults are 0.5 % stretch, 300 km to top up, and 1500 km to clean and relubricate, editable per chain. | The intervals are the user's and are the same for oil and wax. See [What the workshop needs](#what-the-workshop-needs). |
| A chain runs on oil or wax. Each lubrication records which (assumed: on the entry, not the component). `lubricated` stays the one date for both. | A chain can change lubricant. |
| Over-full types start with nothing in use after the migration. | A wrong guess is silent; an empty slot is visible. |
| Whole-component `distance` in history is the component's own distance, including the starting distance. | It differs from "since installed" for used parts, and for a part that came off and went back on. |
| A worn-out component can be retired and restored, in this batch. | A replaced part should not stay available for use. |
| Wrong swaps and readings are corrected with undo, a lower odometer, and deleting care entries. | Smaller than editing past periods. |

### Ruled out

- **Adding each ride to a stored total per component:** a late swap would credit the wrong chain and need manual fixes.
- **A ride log as the distance source now:** more typing per ride, and two rides on a swap day are ambiguous. Imported
  rides can raise the odometer later.
- **An `isActive` flag next to the periods:** the two could disagree.
- **Usage periods on the bicycle:** removing the bicycle would erase the parts' distance.
- **A generic measurements map:** only the chain has readings today.
- **Closing periods and changing bicycles in two writes:** the second can fail, and a state between them can be saved.

### Out of scope

- Notifications, due dates, and forecasts (events manager).
- Readings for other types. Candidates: brake pad and rotor thickness, tire wear, fork service hours, fluid age.
- Wheelsets: swapping a wheel does not move its tire, cassette, or rotors.
- Front/rear position for wheels and tires, retiring a spare component, a list of spares, editing or
  deleting components, and removing a component from a bicycle in the UI. The store handles removal (rule 8).
- Editing past usage periods, other than undo. Editing care entries; they are deleted and logged again.
- Ride import from Garmin and Zwift, indoor distance, and miles.

## Workflow

> **Changed from the README default:**
>
> - One batch branch and no ticket branches, as in earlier batches, so a ticket goes from `In Progress` straight to
>   `Done` with its commit. The header says "Batch branch" instead of "Dev branch".
> - Plan and tickets are removed before the PR.
> - #31 and #35–#40 change e2e flows or visual snapshots, so they run those lanes in Docker. The others skip e2e.

1. Pick the highest-priority ticket in the [Tickets](#tickets) table whose status is `Ready for Dev` and whose
   **Blocked by** tickets are all `Done`. On a tie, take the lowest number.
2. Set its status to `In Progress` in the ticket file and the table.
3. Check out the batch branch and pull it.
4. Implement the ticket in its owning layer, with tests, translations, and desktop and mobile stories for changed UI.
   Update the docs it makes outdated in the same commit.
5. Run `npm run typecheck`, `npm run lint`, the narrowest test lane, then `npm run test:all`.
6. Run the `code-reviewer` subagent and address findings.
7. Commit as `<type>: #24 <description> (ticket <n>)`, including the status change to `Done`.
8. When every ticket is `Done`, move [Design](#design) decisions that are not yet in `docs/` there, remove `plan.md` and
   the ticket files, commit, and open the PR.

### Branching rules

| Branch | Name | Created from | Merges into |
| --- | --- | --- | --- |
| Batch | `24-ui-implement-add-component-screen` | `master` | `master`, once per batch |

- Commit each ticket directly on the batch branch. Do not rebase or force-push it.

### Merge rules

- **Batch → master:** open a PR (CI runs there) and merge with a **merge commit**. Title:
  `merge: #24 ui-implement-add-component-screen into master`. The description lists the tickets.
- **Syncing:** if `master` moves, merge it into the batch branch before the next ticket.
- **After the merge:** delete the batch branch.

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- #23 is not in `master`, or `master` with #23 is not merged into the batch branch.
- A saved entity needs a shape that differs from [Data](#data-saved-data-version-2).
- Acceptance criteria are ambiguous or contradict another ticket or the store docs.
- A new npm dependency or a change to the Electron security posture would be needed.
- The current branch is not the batch branch, or merging `master` into it conflicts.

### Definition of done

- [ ] All tickets are `Done`, one commit each on the batch branch
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally; coverage thresholds hold
- [ ] The worked example passes as a store test and as an Electron e2e flow, with a restart
- [ ] Version 1 data loads with every bicycle, component, and history entry kept
- [ ] Desktop and mobile stories exist for changed UI; visual snapshots are updated in Docker
- [ ] `docs/store/` and `docs/design/` match the code
- [ ] `plan.md` and ticket files removed
- [ ] Batch → master PR is green in CI and merged with a merge commit

## Tickets

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#29](./29-save-version-2-shape.md) | Save the version 2 shape and migrate version 1 | Feature | P1 | M | Ready for Dev | — |
| [#30](./30-add-spare-component.md) | Add a spare component from the menu | Feature | P1 | M | Ready for Dev | #29 |
| [#31](./31-record-bicycle-distance.md) | Record a bicycle's distance | Feature | P1 | M | Ready for Dev | #29 |
| [#32](./32-start-stop-swap-components.md) | Start, stop, and swap components in the store | Feature | P1 | M | Ready for Dev | #29 |
| [#33](./33-keep-usage-valid.md) | Keep usage valid when components or bicycles are removed | Feature | P1 | S | Ready for Dev | #32 |
| [#34](./34-derive-component-usage.md) | Derive component distance and wear | Feature | P1 | S | Ready for Dev | #31, #33 |
| [#35](./35-assign-while-adding.md) | Assign a component while adding it | Feature | P1 | M | Ready for Dev | #30, #34 |
| [#36](./36-show-and-swap-components.md) | Show and swap components on bicycle details | Feature | P1 | M | Ready for Dev | #34, #35 |
| [#37](./37-log-chain-care.md) | Log chain stretch, lubrication, and cleaning | Feature | P2 | M | Ready for Dev | #36 |
| [#38](./38-undo-component-start.md) | Undo the last start of a component | Feature | P2 | S | Ready for Dev | #36 |
| [#39](./39-care-history.md) | Show and delete chain care entries | Feature | P2 | S | Ready for Dev | #37 |
| [#40](./40-retire-component.md) | Retire and restore a component | Feature | P2 | M | Ready for Dev | #36, #38 |

### Expected end state

- **Add component** works, components can be assigned and swapped, and every row shows its distance. Chains show
  stretch, lubrication, and cleaning. A wrong swap can be undone, and a wrong care entry deleted. A worn part can be
  retired.
- Saved data is version 2; version 1 data upgrades on start. Version 2 data opened by an older build is backed up, and
  that build starts empty, as documented in [docs/store/README.md §4](../docs/store/README.md#4-persistence).
- `events` and the root `history` stay placeholders. `getComponentUsage` and `limits` are ready for the events manager.
- Existing store, `App`, and persistence tests are regression coverage.
