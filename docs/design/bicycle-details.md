# Design: Bicycle details screen

> **Status:** Implemented
> **Batch:** #19
> **Builds on:** [bicycle-card-list.md](./bicycle-card-list.md), [the bicycle slice](../store/bicycle.md),
> [the components slice](../store/components.md)
> **Last updated:** 2026-11-26 (in use and resting, swap dialog, batch #24)

## 1. Goal

Replace the bicycle details placeholder with the bicycle's fields and its components, let the user include components
on the bicycle, and show which components are in use and which rest, with their distances, so the rider can swap them.

## 2. Screen

One column, at most `sm` wide:

- The bicycle's name (`<h2>`).
- Company, model, purchase date, frame size, and frame geometry (`<dl>`). Unknown values read "Not specified". The date
  is formatted for the app language; the geometry keeps its line breaks.
- "Distance" (`<h3>`, a labelled `<section>`) with the **Update distance** button, then the odometer in km and the
  reading date, or "Not specified" (`<dl>`).
- "Components" (`<h3>`) with the **Include component** button, then:
  - one notice (`Alert`, info) per type that has components but none in use, for example after the migration found
    three chains: "Chain: none in use. Choose one under Resting with Use now.";
  - **In use** and **Resting** (`<h4>`), each naming its list. An empty list and its heading are not shown. Rows keep
    the bicycle's order;
  - without components, a short message instead of the lists.

`ComponentList` (`src/ui/components/ComponentList/`) is reusable. It takes ready-to-show rows (`{ component, usage }`,
with `usage` from `getComponentUsage`) and an optional `renderAction` slot. A row shows:

| Line | Shown | Value |
| --- | --- | --- |
| Type, then model | Always | Translated type above the model |
| Label | When set | The label |
| Distance | Always | `usage.distance`, km |
| Since installed | In use | `usage.distanceSinceInstalled`, km |
| Lubricant | Chains (`CHAIN_CARE_TYPES`) | Oil or Wax, from the newest lubrication |
| Stretch, Since lubrication, Since cleaning | Chains | "250 of 300 km" against `limits`; the value alone without a limit |

- The labelled values are a `<dl>`. Unknown values read "Not specified".
- A value at or above its limit adds ", limit reached" and is bold, so text and not color alone says so. Bold stays at
  `text.primary`, because `error.main` on the elevated `Paper` in dark mode would fall below 4.5:1.
- The action sits beside the text and moves under it when the row is narrow; long models and labels wrap
  (`overflowWrap: anywhere`).
- With `rowIdPrefix`, each row has an `id` (`toRowId`) and `tabIndex={-1}`, so a screen can move focus to it; the row
  then shows a focus outline.

A resting row has **Use now** (outlined button). Its accessible name also names the component ("Use now: Chain KMC
X12 (B)"), so identical buttons can be told apart.

## 3. Include component dialog

| Field | Shown | Input |
| --- | --- | --- |
| Component | Only when there are spare components | Select: "New component" (default) or a spare one, shown as "Chain: KMC X12 (A), 1,500 km" (type, model, label if any, distance) |
| Type | For a new component | Select of the 17 types |
| Model | For a new component | Text |

- A component is **spare** when it is on no bicycle. Components on another bicycle are not offered, because a part is
  physically on one bicycle at a time. The store enforces this too (`notAllowed` on `componentId`).
- Each spare shows its distance (`getComponentUsage`), so three identical chains can be told apart.
- If the chosen spare component stops being spare while the dialog is open, the choice falls back to "New component".
- **Include** stores a new component and adds it to the bicycle in one action, or adds the chosen spare one. Either
  starts in use today, at the bicycle's odometer, when its type has room there (`hasRoomForType`, rule 2), and rests
  otherwise; the dialog never replaces a component. On success the dialog closes and the component is the last row.
- On failure the dialog stays open. Invalid fields show their message and the first one gets focus; a failure that
  belongs to no field (a full bicycle, for example) shows as an alert until the next edit.
- **Cancel**, Escape, and a click outside drop the draft, without asking. Closing returns focus to the button.
- The dialog is unmounted when closed, so a double click or a repeated Enter cannot store a component twice.
- Selects are native, so phones show their own picker.
- The theme removes the elevation overlay from every `Dialog`. On the overlay, dark-mode error text had only 2.8:1
  contrast; on `background.paper` it passes WCAG AA.

## 4. Update distance dialog

| Field | Input |
| --- | --- |
| Update by | Radios: **Set total** (default) or **Add ride** |
| Total distance / Ride distance | Decimal text, `km`; focused when the dialog opens |
| Date | Native date picker, today by default; empty means unknown |

- **Set total** saves the typed number. **Add ride** saves the current total plus the ride, rounded to one decimal; the
  hint names the current total.
- The store rejects a total below the latest usage boundary on the bicycle (rule 6). The message names that reading:
  "The total must be from 3,100 to 500,000 km." In **Add ride** mode it reads "The ride must bring the total to
  between 3,100 and 500,000 km." `App` passes it as `minimumOdometer` (`getMinimumOdometer`).
- Text that is not a number, including an empty field, is submitted as `NaN` and explained as "Enter a number". A
  half-typed date is submitted so the store rejects it, as on the add bicycle form.
- On success the dialog closes. **Cancel**, Escape, and a click outside drop the draft. Closing returns focus to the
  button. The dialog is unmounted when closed, like the include dialog.
- "Today" comes from the UI (`getToday`, the local date); the store has no clock.

## 5. Use component dialog (swap)

Opened by **Use now** on a resting row. Titled "Put component in use"; the first line names the component and its
distance ("Chain KMC X12 (B), 1,600 km").

| Field | Shown | Input |
| --- | --- | --- |
| Replaces | When the type is full: as many in use as `ACTIVE_LIMITS` allows | Native select of the components of that type in use, with label and distance. With exactly one it is preselected and has no empty option; otherwise "Choose a component" comes first and gets focus |
| Date | Always | Native date picker, today by default; empty means unknown |
| Odometer | Always | Decimal text, `km`, the bicycle's odometer by default; focused when nothing needs choosing |

- **Use now** calls `startComponentUse` with the reading and the replaced component (`null` when the type has room).
  A lower reading enters a swap late: the store ends the replaced period there, so the distance splits at that
  reading. When no chain is in use and none has periods, a reading of 0 credits the chosen chain with everything since
  0.
- A rejected reading names the readings the store accepts: "The odometer must be from 1,500 to 4,500 km."
  (`getStartRange` for the component and the chosen replacement, computed after the rejection). When no reading is
  accepted, it reads "This value cannot be used." A missing replacement reads "Choose the component to replace.", text
  that is not a number "Enter a number, for example 1500.", and a half-typed date is submitted so the store rejects it.
  The first invalid field gets focus. An error that belongs to no field (`usage` full, for example) shows as an alert
  until the next edit.
- On success the dialog closes and focus moves to the component's row, now under **In use** (the replaced one moves
  to **Resting**). **Cancel**, Escape, and a click outside drop the draft and return focus to **Use now**.
- The dialog is unmounted when closed, and it is shown only while the chosen component still rests.
- The type being full is read from the rows shown, so the dialog and the lists agree.

## 6. Wiring

- `App` passes the bicycle, its rows (`getInstalledComponents(...)` with `getComponentUsage` for each), and the spares
  with their distances, both memoized, because `getComponentUsage` returns a new object. It wires the include callbacks
  to `addComponentToBicycle` (new) and `assignComponent` (spare), each with a start when the type has room. It passes
  `getMinimumOdometer(...)` and wires `onSetOdometer` to `setBicycleOdometer`, `onStartComponent` to
  `startComponentUse`, and `getStartRange` to the store utility of that name.
- Which dialog is open, its draft, and its errors are local state. The row to focus after a start is a ref, read in an
  effect after the commit that closes the dialog (after the dialog has returned focus to its removed button). The store
  owns all validation.

## 7. Out of scope

- Removing a component from a bicycle, moving it between bicycles, and editing it.
- Undoing a start (#38), retiring (#40), and logging or listing chain care (#37, #39).
- Notifications when a limit is reached.
- Editing or deleting the bicycle, a log of odometer readings, and importing rides.
- The "Add component" menu screen (since implemented, see [add-component.md](./add-component.md)).
