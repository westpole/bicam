# Design: Bicycle details screen

> **Status:** Implemented
> **Batch:** #19
> **Builds on:** [bicycle-card-list.md](./bicycle-card-list.md), [the bicycle slice](../store/bicycle.md),
> [the components slice](../store/components.md)
> **Last updated:** 2026-11-25 (distance, batch #24)

## 1. Goal

Replace the bicycle details placeholder with the bicycle's fields and its components, and let the user include
components on the bicycle.

## 2. Screen

One column, at most `sm` wide:

- The bicycle's name (`<h2>`).
- Company, model, purchase date, frame size, and frame geometry (`<dl>`). Unknown values read "Not specified". The date
  is formatted for the app language; the geometry keeps its line breaks.
- "Distance" (`<h3>`, a labelled `<section>`) with the **Update distance** button, then the odometer in km and the
  reading date, or "Not specified" (`<dl>`).
- "Components" (`<h3>`) with the **Include component** button, then the list: one row per component, type above model,
  in the bicycle's order. Without components a short message shows instead. Rows are not interactive.

`ComponentList` (`src/ui/components/ComponentList/`) is reusable and read-only.

## 3. Include component dialog

| Field | Shown | Input |
| --- | --- | --- |
| Component | Only when there are spare components | Select: "New component" (default) or a spare one |
| Type | For a new component | Select of the 17 types |
| Model | For a new component | Text |

- A component is **spare** when it is on no bicycle. Components on another bicycle are not offered, because a part is
  physically on one bicycle at a time. The store enforces this too (`alreadyInstalled`).
- If the chosen spare component stops being spare while the dialog is open, the choice falls back to "New component".
- **Include** stores a new component and adds it to the bicycle in one action, or adds the chosen spare one. On success
  the dialog closes and the component is the last row.
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

## 5. Wiring

- `App` passes the bicycle, `getInstalledComponents(...)`, and `getSpareComponents(...)`, and wires the callbacks to
  `addComponentToBicycle` (new) and `updateBicycle` (spare). It passes `getMinimumOdometer(...)` and wires
  `onSetOdometer` to `setBicycleOdometer`.
- Which dialog is open, its draft, and its errors are local state. The store owns all validation.

## 6. Out of scope

- Removing a component from a bicycle, moving it between bicycles, and editing it.
- Component history (installed date, distance, care) on the screen.
- Editing or deleting the bicycle, a log of odometer readings, and importing rides.
- The "Add component" menu screen (since implemented, see [add-component.md](./add-component.md)).
