# Design: Add component screen

> **Status:** Implemented
> **Batch:** #24
> **Builds on:** [add-bicycle.md](./add-bicycle.md), [bicycle-details.md](./bicycle-details.md),
> [the components slice](../store/components.md)
> **Last updated:** 2026-11-25

## 1. Goal

Replace the "Add component" placeholder with a form that stores a component, either as a spare (on no bicycle), so a
rider can add several identical parts, for example three chains labelled A, B, and C, without leaving the screen, or
on a bicycle, in use when its type has room (#35).

## 2. Form

One column, at most `sm` wide. Fields, top to bottom:

| Field | Required | Input | Notes |
| --- | --- | --- | --- |
| Type | Yes | Native select | "Choose a type", then the 17 types |
| Model | Yes | Text | |
| Label | No | Text | Tells identical parts apart |
| Starting distance | No | Decimal text, `km` | Empty means 0 (a new part) |
| *Limits* (`h3` with a hint) | | | Empty means no limit |
| Replace after | No | Decimal text, `km` | Every type |
| Replace at stretch | No | Decimal text, `%` | Chain only; the hint gives 0.5 % (11–13-speed) and 0.75 % (5–10-speed) |
| Top up lubricant every | No | Decimal text, `km` | Chain only |
| Clean and relubricate every | No | Decimal text, `km` | Chain only |
| Bicycle | No | Native select | Only when there are bicycles: "None" (default), then the bicycles by name |
| In use now | | Switch | Only with a bicycle; the hint names the bicycle's odometer |
| Replaces | Yes, when shown | Native select | Only when "In use now" is on and the type is full on that bicycle |

Limits are in [components.md §2](../store/components.md#2-fields-and-limits).

## 3. Behavior

- **Choosing a type** fills the limits the rider has not edited with that type's suggestions (`getDefaultLimits`):
  a chain gets 0.5 %, 300 km, and 1500 km. Another type clears the suggestions again. Limits the rider typed into keep
  their values across type changes. The chain-only fields show only for a chain.
- **Numbers** are typed as text with a decimal keyboard (`inputMode="decimal"`), so the form sees what was typed. Text
  that is not a plain decimal number (`1,5`, `abc`, `1e3`) is submitted as `NaN`, which the store rejects as
  `invalidFormat`, instead of being saved as empty.
- **Save component** passes the input to the store's `addComponent`. Chain-only limits are left out for other types,
  also edited ones, so a hidden field never blocks a save. An empty starting distance is left out (the store stores 0);
  an empty limit is `null`.
- **On success** the form clears, focus returns to Type, and a success message (`role="status"`) names the component,
  for example "Chain KMC X12 (A) was added." It stays until the next edit. Edited limits are forgotten, so the next
  chain gets the suggestions again.
- **On failure** every invalid field shows its message and the first one gets focus. Editing a field clears its message.
  An error for a field the form does not show appears as an alert above the buttons, until the next edit.
- **Bicycle and use** (rule 2 in [components.md §2.3](../store/components.md#23-usage-and-limits)): "In use now"
  starts on when the type has room on the chosen bicycle (`hasRoomForType`), and off otherwise; without a type yet it
  is on. The rider can change it. Choosing another type or bicycle restores the default and drops the replaced
  component. When it is on and the type is full, **Replaces** lists the components of that type in use there
  (`getComponentsInUse`), by model and label; with one candidate it is preselected, otherwise "Choose a component"
  comes first. `resolvePlacement` applies these defaults.
- **Use** starts today at the bicycle's current odometer (`getCurrentUse`, shared with the include dialog). A late start is a swap with an earlier reading
  (#36).
- **Saved with a bicycle**, `App` opens that bicycle's details. **Saved as a spare**, the form clears as described
  above. The form clears in both cases, so it is empty if it stays on screen.
- A `replaces` error shows under **Replaces** and focuses it; other start errors (`odometer`, `date`, `components`)
  show the general alert.
- **Cancel** returns to `home` and drops the draft, without asking. Leaving through the menu or the header title link
  also drops it.
- The store owns all validation; the form only translates error codes. Native validation is off (`noValidate`).

## 4. Wiring

- `App` passes `bicycles` (each bicycle with `getInstalledComponents`, memoized), `onSubmit`, and `onCancel`
  (`navigateTo('home')`). `onSubmit(input, placement)` calls `addComponent` for a spare (`placement: null`; the screen
  stays open), or `addComponentToBicycle(bicycleId, input, use)` and then `openBicycleDetails`.
- `addComponent` left `SCREEN_COMPONENTS` and `PropLessScreen`, as `addBicycle` did.
- Component error texts live under `components.errors` in the translations, and `getComponentErrorMessage`
  (`src/ui/components/screens/utilities/`) translates them for this form and the include dialog on the bicycle details
  screen, so both explain an error in the same words.

## 5. Out of scope

- An edit screen, and a start at an earlier reading.
- A list of spare components.
