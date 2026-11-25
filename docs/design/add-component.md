# Design: Add component screen

> **Status:** Implemented
> **Batch:** #24
> **Builds on:** [add-bicycle.md](./add-bicycle.md), [bicycle-details.md](./bicycle-details.md),
> [the components slice](../store/components.md)
> **Last updated:** 2026-11-25

## 1. Goal

Replace the "Add component" placeholder with a form that stores a spare component (on no bicycle), so a rider can add
several identical parts, for example three chains labelled A, B, and C, without leaving the screen.

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
- **Cancel** returns to `home` and drops the draft, without asking. Leaving through the menu or the header title link
  also drops it.
- The store owns all validation; the form only translates error codes. Native validation is off (`noValidate`).

## 4. Wiring

- `App` passes `onSubmit` (the store's `addComponent`; the screen stays open) and `onCancel` (`navigateTo('home')`).
- `addComponent` left `SCREEN_COMPONENTS` and `PropLessScreen`, as `addBicycle` did.
- Component error texts live under `components.errors` in the translations, and `getComponentErrorMessage`
  (`src/ui/components/screens/utilities/`) translates them for this form and the include dialog on the bicycle details
  screen, so both explain an error in the same words.

## 5. Out of scope

- Choosing a bicycle while adding (#35) and an edit screen.
- A list of spare components.
