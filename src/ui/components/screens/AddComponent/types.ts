import type {
  BicycleComponent,
  ComponentErrorCode,
  ComponentField,
  ComponentInput,
  ComponentLimits,
  ComponentResult,
} from '@store/components/types';

/** A component field the form edits: every validated field except the generated `id`. */
export type AddComponentField = Exclude<ComponentField, 'id'>;

/** Draft values as typed; `''` means the field is empty. Numbers stay text until submit. */
export type AddComponentValues = Record<AddComponentField, string>;

/** The store's error code for each invalid field. */
export type AddComponentErrors = Partial<Record<AddComponentField, ComponentErrorCode>>;

/** Key of a field under `screens.addComponent.fields` in the translations. */
export type AddComponentFieldKey =
  | 'type'
  | 'model'
  | 'label'
  | 'initialDistance'
  | 'limitDistance'
  | 'limitStretch'
  | 'limitLubrication'
  | 'limitCleaning';

/** How one form field is rendered. */
export interface AddComponentFieldDefinition {
  /** The field; also the input's `name`. */
  field: AddComponentField;
  /** Its translation key under `screens.addComponent.fields`. */
  key: AddComponentFieldKey;
  /** Input variant: single-line text (default), a native select of the types, or a decimal number. */
  kind?: 'select' | 'number';
  /** Whether the store rejects an empty value. */
  required?: boolean;
  /** Unit shown after a number, as its key under `screens.addComponent.units`. */
  unit?: 'km' | 'percent';
  /** The limit this field edits, for the limit fields. */
  limit?: keyof ComponentLimits;
}

/** A line shown under the fields after a save, until the next edit. */
export type AddComponentNotice =
  | {
      /** Raised by each save and used as the React key, so screen readers announce a repeated notice again. */
      key: number;
      /** The component was stored. */
      kind: 'saved';
      /** The stored component, named in the message. */
      component: BicycleComponent;
    }
  | {
      /** See above. */
      key: number;
      /** The store rejected a field the form does not show. */
      kind: 'error';
    };

/** Props for {@link AddComponent}. */
export interface AddComponentProps {
  /**
   * Called with the form's input on submit. Validates and stores a spare component, and returns the store's result, so
   * the form can show the errors or name the stored component.
   */
  onSubmit: (input: ComponentInput) => ComponentResult;
  /** Called when the user leaves the form without saving. */
  onCancel: () => void;
}
