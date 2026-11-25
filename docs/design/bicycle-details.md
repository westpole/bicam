# Design: Bicycle details screen

> **Status:** Implemented
> **Batch:** #19
> **Builds on:** [bicycle-card-list.md](./bicycle-card-list.md), [the bicycle slice](../store/bicycle.md),
> [the components slice](../store/components.md)
> **Last updated:** 2026-11-25

## 1. Goal

Replace the bicycle details placeholder with the bicycle's fields and its components, and let the user include
components on the bicycle.

## 2. Screen

One column, at most `sm` wide:

- The bicycle's name (`<h2>`).
- Company, model, purchase date, frame size, and frame geometry (`<dl>`). Unknown values read "Not specified". The date
  is formatted for the app language; the geometry keeps its line breaks.
- "Components" (`<h3>`) with the **Include component** button, then the list: one row per component, type above model,
  in the bicycle's order. Without components a short message shows instead. Rows are not interactive.

`ComponentList` (`src/ui/components/ComponentList/`) is reusable and read-only.

## 3. Include component dialog

| Field | Shown | Input |
| --- | --- | --- |
| Component | Only when there are spare components | Select: "New component" (default) or a spare one |
| Type | For a new component | Select of the 16 types |
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

## 4. Wiring

- `App` passes the bicycle, `getInstalledComponents(...)`, and `getSpareComponents(...)`, and wires the callbacks to
  `addComponentToBicycle` (new) and `updateBicycle` (spare).
- Whether the dialog is open, its draft, and its errors are local state. The store owns all validation.

## 5. Out of scope

- Removing a component from a bicycle, moving it between bicycles, and editing it.
- Component history (installed date, distance, care) on the screen.
- Editing or deleting the bicycle.
- The "Add component" menu screen, which is still a placeholder.
