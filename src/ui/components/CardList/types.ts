import type { ReactNode } from 'react';

/** One card of a {@link CardList}. */
export interface CardListItem<Id extends string = string> {
  /** Stable identifier: the React key and the value passed to `onItemClick`. */
  id: Id;
  /** First content row (translated text, or user text such as a bicycle name); also the card button's name. */
  title: string;
  /**
   * Image shown on the left of the card. Decorative: it is hidden from assistive tech. It renders inside a
   * `<button>`, so use phrasing elements (e.g. `Avatar component="span"`), not `<div>`s.
   */
  media: ReactNode;
}

/** Props for {@link CardList}. */
export interface CardListProps<Id extends string = string> {
  /** Cards, rendered top to bottom in this order. */
  items: readonly CardListItem<Id>[];
  /** Called with the `id` of the card the user activated (click, tap, Enter, or Space). */
  onItemClick: (id: Id) => void;
  /** Accessible name for the list. */
  'aria-label'?: string;
}
