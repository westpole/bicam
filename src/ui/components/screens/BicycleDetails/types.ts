import type { Bicycle, BicycleResult } from '@store/bicycle/types';
import type { BicycleComponent, ComponentErrorCode, ComponentId, ComponentInput } from '@store/components/types';
import type { BicycleComponentResult } from '@store/types';

/** A bicycle field shown in the details; also its translation key under `screens.addBicycle.fields`. */
export type BicycleDetailsField = 'company' | 'model' | 'purchased' | 'size' | 'frameGeometry';

/** Callbacks that put a component on the shown bicycle. Both return the store's result, so errors can be shown. */
interface IncludeComponentHandlers {
  /** Stores a new component and adds it to the bicycle. Called with the raw form values. */
  onCreateComponent: (input: ComponentInput) => BicycleComponentResult;
  /** Adds a stored component to the bicycle. */
  onIncludeComponent: (id: ComponentId) => BicycleResult;
}

/** Props for {@link BicycleDetails}. */
export interface BicycleDetailsProps extends IncludeComponentHandlers {
  /** The selected bicycle. */
  bicycle: Bicycle;
  /** The bicycle's components, in its own order. */
  components: readonly BicycleComponent[];
  /** Stored components that are on no bicycle, in display order. */
  spareComponents: readonly BicycleComponent[];
}

/** Props for {@link IncludeComponentDialog}. */
export interface IncludeComponentDialogProps extends IncludeComponentHandlers {
  /** Stored components to choose from; without any, only a new component can be created. */
  spareComponents: readonly BicycleComponent[];
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
