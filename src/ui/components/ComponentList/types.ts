import type { BicycleComponent } from '@store/components/types';

/** Props for {@link ComponentList}. */
export interface ComponentListProps {
  /** Components, rendered top to bottom in this order. */
  components: readonly BicycleComponent[];
  /** Id of the element that names the list. */
  'aria-labelledby'?: string;
}
