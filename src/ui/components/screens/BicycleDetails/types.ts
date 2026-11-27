import type { Bicycle, BicycleErrorCode, BicycleOdometerInput, BicycleResult } from '@store/bicycle/types';
import type {
  BicycleComponent,
  ComponentErrorCode,
  ComponentId,
  ComponentInput,
  ComponentStartInput,
  ComponentUsageResult,
  StartRange,
} from '@store/components/types';
import type { BicycleComponentResult } from '@store/types';
import type { ComponentRow } from '@ui/components/ComponentList/types';

/** A bicycle field shown in the details; also its translation key under `screens.addBicycle.fields`. */
export type BicycleDetailsField = 'company' | 'model' | 'purchased' | 'size' | 'frameGeometry';

/**
 * Callbacks that put a component on the shown bicycle, in use when its type has room there (the caller decides). Both
 * return the store's result, so errors can be shown.
 */
interface IncludeComponentHandlers {
  /** Stores a new component and adds it to the bicycle. Called with the raw form values. */
  onCreateComponent: (input: ComponentInput) => BicycleComponentResult;
  /** Adds a stored component to the bicycle. */
  onIncludeComponent: (id: ComponentId) => BicycleComponentResult;
}

/** A stored component on no bicycle, with its distance (`getComponentUsage`), so identical spares can be told apart. */
export interface SpareComponent {
  /** The spare component. */
  component: BicycleComponent;
  /** Its own distance in kilometres. */
  distance: number;
}

/** Props for {@link BicycleDetails}. */
export interface BicycleDetailsProps extends IncludeComponentHandlers {
  /** The selected bicycle. */
  bicycle: Bicycle;
  /** The bicycle's components with their usage (`getComponentUsage`), in its own order. */
  rows: readonly ComponentRow[];
  /** Stored components that are on no bicycle, with their distance, in display order. */
  spareComponents: readonly SpareComponent[];
  /** The lowest odometer reading the bicycle may be set to (`getMinimumOdometer`), named when a total is too low. */
  minimumOdometer: number;
  /** Stores a new odometer reading. Returns the store's result, so errors can be shown. */
  onSetOdometer: (input: BicycleOdometerInput) => BicycleResult;
  /** Puts one of the bicycle's resting components in use (a swap when `replaces` is set). Returns the store's result. */
  onStartComponent: (componentId: ComponentId, input: ComponentStartInput) => ComponentUsageResult;
  /** The readings the store accepts for starting `componentId` in place of `replaces` (`getStartRange`). */
  getStartRange: (componentId: ComponentId, replaces: ComponentId | null) => StartRange | null;
}

/** Props for {@link IncludeComponentDialog}. */
export interface IncludeComponentDialogProps extends IncludeComponentHandlers {
  /** Stored components to choose from, with their distance; without any, only a new component can be created. */
  spareComponents: readonly SpareComponent[];
  /** Called after a component was included, and when the user leaves the dialog without including one. */
  onClose: () => void;
}

/** A field of the "new component" form: the quick path has the type and the model only. */
export type NewComponentField = 'type' | 'model';

/** The store's error code for each invalid field. */
export type NewComponentErrors = Partial<Record<NewComponentField, ComponentErrorCode>>;

/** A rejected save that no form field explains. */
export interface IncludeComponentAlert {
  /** Raised by each rejected save and used as the React key, so screen readers announce a repeated alert again. */
  key: number;
  /** Whether the bicycle has no room for another component. */
  isFull: boolean;
}

/** Props for {@link UpdateDistanceDialog}. */
export interface UpdateDistanceDialogProps {
  /** The bicycle's current odometer reading, which a ride is added to. */
  odometer: number;
  /** See {@link BicycleDetailsProps.minimumOdometer}. */
  minimumOdometer: number;
  /** See {@link BicycleDetailsProps.onSetOdometer}. */
  onSetOdometer: (input: BicycleOdometerInput) => BicycleResult;
  /** Called after a reading was saved, and when the user leaves the dialog without saving. */
  onClose: () => void;
}

/** How the rider updates the distance: by typing the new total, or a ride that is added to the current total. */
export type UpdateDistanceMode = 'total' | 'ride';

/** A field of the update distance dialog. `distance` holds the total or the ride, depending on the mode. */
export type UpdateDistanceField = 'distance' | 'date';

/** The store's error code for each invalid dialog field. */
export type UpdateDistanceErrors = Partial<Record<UpdateDistanceField, BicycleErrorCode>>;

/** Props for {@link UseComponentDialog}. */
export interface UseComponentDialogProps {
  /** The resting component to put in use, with its usage. */
  row: ComponentRow;
  /** Components of the same type in use on the bicycle, which it can replace, in the bicycle's order. */
  candidates: readonly ComponentRow[];
  /** Whether the type is full, so the dialog asks which component to replace. */
  needsReplace: boolean;
  /** The bicycle's current odometer, the default reading. */
  odometer: number;
  /** Starts the component with the dialog's input. Returns the store's result, so errors can be shown. */
  onStart: (input: ComponentStartInput) => ComponentUsageResult;
  /** The readings the store accepts for this start when it replaces `replaces`, named when a reading is rejected. */
  getStartRange: (replaces: ComponentId | null) => StartRange | null;
  /** Called after the component was started, and when the user leaves the dialog without starting it. */
  onClose: () => void;
}

/** A field of the use component dialog, also the store's field name. */
export type UseComponentField = 'replaces' | 'date' | 'odometer';

/** The store's error code for each invalid dialog field. */
export type UseComponentErrors = Partial<Record<UseComponentField, ComponentErrorCode>>;
