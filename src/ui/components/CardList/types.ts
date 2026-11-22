import type { ReactNode } from 'react';

/** One card of a {@link CardList}. */
export interface CardListItem<Id extends string = string> {
  /** Stable identifier: the React key. */
  id: Id;
  /** First content row (already translated, or user-typed text such as a bicycle name). */
  title: string;
  /** Image shown on the left of the card. Decorative: it is hidden from assistive tech. */
  media: ReactNode;
}

/** Props for {@link CardList}. */
export interface CardListProps<Id extends string = string> {
  /** Cards, rendered top to bottom in this order. */
  items: readonly CardListItem<Id>[];
  /** Accessible name for the list. */
  'aria-label'?: string;
}
