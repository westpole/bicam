import type { Bicycle } from '@store/bicycle/types';

/** Props for {@link Home}. */
export interface HomeProps {
  /** The user's bicycles, in display order (`bicycle.allIds`). */
  bicycles: readonly Bicycle[];
}
