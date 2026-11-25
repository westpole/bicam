# Design: Add bicycle screen

> **Status:** Implemented
> **Batch:** #17
> **Builds on:** [app-menu.md](./app-menu.md), [bicycle-card-list.md](./bicycle-card-list.md),
> [the bicycle slice](../store/bicycle.md)
> **Last updated:** 2026-11-24

## 1. Goal

Replace the "Add bicycle" placeholder with a form that stores a new bicycle.

## 2. Form

One column, at most `sm` wide. Fields, top to bottom:

| Field | Required | Input |
| --- | --- | --- |
| Name | Yes | Text |
| Company | Yes | Text |
| Model | Yes | Text |
| Purchase date | No | Native date picker |
| Frame size | No | Text |
| Frame geometry | No | Multi-line text |

Limits are in [bicycle.md §2](../store/bicycle.md#2-fields-and-limits).

## 3. Behavior

- **Save bicycle** passes the values to the store's `addBicycle`. On success the app returns to `home`, where the new
  bicycle is the last card. On failure the form stays open, every invalid field shows its message, and the first one
  gets focus. Editing a field clears its message. An error for a field the form does not have (for example
  `components`) shows as a general alert above the buttons, until the next edit.
- **Cancel** returns to `home` and drops the draft, without asking. Leaving through the menu also drops it.
- The store owns all validation; the form only translates error codes and adds no rules. Native validation is off
  (`noValidate`).
- A half-typed date reads as `''` in browsers, which would be saved as "unknown". The form detects it
  (`validity.badInput`) and submits a value the store rejects.
- Fields have no `maxLength`, so pasted text is never cut off silently; the store reports `tooLong`.

## 4. Wiring

- `App` passes `onSubmit` (calls `addBicycle`, then `navigateTo('home')` on success) and `onCancel`. The store is
  unchanged; navigation is not part of `addBicycle`, so other callers can add bicycles without leaving their screen.
- The draft and the shown errors are local state of the form.
- `addBicycle` left `SCREEN_COMPONENTS`, which now holds only the menu screens that need no props (`PropLessScreen`).

## 5. Out of scope

- Choosing installed components (there is no way to add components yet; new bicycles start with none).
- Editing or deleting a bicycle, photos, and a warning for future purchase dates.
- An empty state on `home`.
