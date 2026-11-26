import type { Bicycle, BicycleErrorCode, BicycleOdometerInput, BicycleResult } from '@store/bicycle/types';
import type { BicycleComponent, ComponentErrorCode, ComponentId, ComponentInput } from '@store/components/types';
import type { BicycleComponentResult } from '@store/types';

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
  /** The bicycle's components, in its own order. */
  components: readonly BicycleComponent[];
  /** Stored components that are on no bicycle, with their distance, in display order. */
  spareComponents: readonly SpareComponent[];
  /** The lowest odometer reading the bicycle may be set to (`getMinimumOdometer`), named when a total is too low. */
  minimumOdometer: number;
  /** Stores a new odometer reading. Returns the store's result, so errors can be shown. */
  onSetOdometer: (input: BicycleOdometerInput) => BicycleResult;
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
