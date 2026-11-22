import type { Bicycle, BicycleId } from '@store/bicycle/types';

/** Props for {@link Home}. */
export interface HomeProps {
  /** The user's bicycles, in display order (`bicycle.allIds`). */
  bicycles: readonly Bicycle[];
  /** Called with the id of the bicycle whose card the user activated. */
  onBicycleClick: (id: BicycleId) => void;
}
