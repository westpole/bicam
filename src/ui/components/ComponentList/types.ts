import type { ReactNode } from 'react';

import type { BicycleComponent, ComponentUsage } from '@store/components/types';

/** One row, ready to show: a component with its derived distance and chain care state (`getComponentUsage`). */
export interface ComponentRow {
  /** The component. */
  component: BicycleComponent;
  /** Its distance, distance since installed, and chain care values. */
  usage: ComponentUsage;
}

/** Key of a row fact; also its term's translation key under `components.list`. */
export type ComponentFactKey =
  | 'label'
  | 'distance'
  | 'sinceInstalled'
  | 'lubricant'
  | 'stretch'
  | 'sinceLubrication'
  | 'sinceCleaning';

/** One labelled value under a row's model, as {@link getRowFacts} builds it. */
export interface ComponentFact {
  /** Which value it is. */
  key: ComponentFactKey;
  /** The translated term. */
  term: string;
  /** The translated value, including "limit reached" when it applies. */
  value: string;
  /** Whether the value is unknown ("Not specified"). */
  isUnknown: boolean;
  /** Whether the value is at or above its limit. */
  isReached: boolean;
}

/** Props for {@link ComponentList}. */
export interface ComponentListProps {
  /** Rows, rendered top to bottom in this order. */
  rows: readonly ComponentRow[];
  /** Renders the controls at the end of a row (for example a button), or nothing. */
  renderAction?: (row: ComponentRow) => ReactNode;
  /**
   * Prefix of each row's `id` (see `toRowId`). With it, rows can take focus from a script (`tabIndex={-1}`), for
   * example after the component was changed in a dialog. Pass the result of `useId()`.
   */
  rowIdPrefix?: string;
  /** Id of the element that names the list. */
  'aria-labelledby'?: string;
}
