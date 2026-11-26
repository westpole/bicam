import type { Bicycle, BicycleId } from '@store/bicycle/types';
import type {
  BicycleComponent,
  ComponentErrorCode,
  ComponentField,
  ComponentId,
  ComponentInput,
  ComponentLimits,
  ComponentStartInput,
} from '@store/components/types';
import type { BicycleComponentResult } from '@store/types';

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

/** A bicycle the new component can be put on, with the components it lists (`getInstalledComponents`). */
export interface AddComponentBicycle {
  /** The bicycle; its odometer is where use starts. */
  bicycle: Bicycle;
  /** Its components, which tell whether the type has room and which one a start can replace. */
  components: readonly BicycleComponent[];
}

/** Where the new component goes: a bicycle, and whether it starts there. */
export interface AddComponentPlacement {
  /** The chosen bicycle. */
  bicycleId: BicycleId;
  /** When it starts: today, at the bicycle's odometer, and what it replaces. Left out when it rests. */
  use?: ComponentStartInput;
}

/** The placement fields as chosen, before the defaults apply. */
export interface AddComponentPlacementDraft {
  /** The chosen bicycle's id, or `''` for none (a spare). */
  bicycleId: string;
  /** "In use now" as the rider set it, or `null` while it follows the default (on when the type has room). */
  inUse: boolean | null;
  /** The chosen component to replace, or `''` for none yet. */
  replaces: string;
}

/** The placement fields as shown, with the defaults applied (`resolvePlacement`). */
export interface ResolvedPlacement {
  /** The chosen bicycle, or `undefined` for none. */
  chosen: AddComponentBicycle | undefined;
  /** Whether "In use now" is on. */
  inUse: boolean;
  /** Components of the type in use on the chosen bicycle, which a start can replace. */
  candidates: readonly BicycleComponent[];
  /** Whether the form asks which component to replace: in use now, and the type is full. */
  needsReplace: boolean;
  /** The component to replace, or `''`; preselected when there is one candidate. */
  replaces: ComponentId | '';
}

/** Props for {@link AddComponent}. */
export interface AddComponentProps {
  /** Bicycles to choose from, in display order. Without any, the bicycle field is hidden and components are spare. */
  bicycles: readonly AddComponentBicycle[];
  /**
   * Called on submit with the form's input and where the component goes (`null` for a spare). Validates and stores it,
   * and returns the store's result, so the form can show the errors or name the stored component.
   */
  onSubmit: (input: ComponentInput, placement: AddComponentPlacement | null) => BicycleComponentResult;
  /** Called when the user leaves the form without saving. */
  onCancel: () => void;
}
