import type { BicycleErrorCode, BicycleInput, BicycleResult } from '@store/bicycle/types';

/** A bicycle field the form edits. `components` is left out: components are added on their own screen. */
export type AddBicycleField = Exclude<keyof BicycleInput, 'components'>;

/** Draft values as typed; `''` means the field is empty. */
export type AddBicycleValues = Record<AddBicycleField, string>;

/** The store's error code for each invalid field. */
export type AddBicycleErrors = Partial<Record<AddBicycleField, BicycleErrorCode>>;

/** How one form field is rendered. */
export interface AddBicycleFieldDefinition {
  /** The field; also the input's `name` and its translation key under `screens.addBicycle.fields`. */
  field: AddBicycleField;
  /** Whether the store rejects an empty value. */
  required?: boolean;
  /** Input variant: single-line text (default), a native date picker, or a multi-line text area. */
  kind?: 'date' | 'multiline';
}

/** Props for {@link AddBicycle}. */
export interface AddBicycleProps {
  /**
   * Called with the raw form values on submit. Validates and stores the bicycle, leaves the screen on success, and
   * returns the store's result so the form can show the errors.
   */
  onSubmit: (input: BicycleInput) => BicycleResult;
  /** Called when the user leaves the form without saving. */
  onCancel: () => void;
}
