/** One row of a {@link VerticalList}. */
export interface VerticalListItem<Id extends string = string> {
  /** Stable identifier: the React key and the value passed to `onItemClick`. */
  id: Id;
  /** Visible (already translated) text, which is also the row button's accessible name. */
  label: string;
}

/** Props for {@link VerticalList}. */
export interface VerticalListProps<Id extends string = string> {
  /** Rows, rendered top to bottom in this order. */
  items: readonly VerticalListItem<Id>[];
  /** Called with the `id` of the row the user activated (click, tap, Enter, or Space). */
  onItemClick: (id: Id) => void;
  /** Id of the current row: it gets the MUI `selected` style and `aria-current="page"`. */
  selectedId?: string;
  /** Accessible name for the list. */
  'aria-label'?: string;
  /** Adds a divider under each row. */
  divided?: boolean;
  /** Uses MUI's compact row density. */
  dense?: boolean;
}
