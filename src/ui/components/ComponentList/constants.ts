import type { SxProps, Theme } from '@mui/material/styles';

/** A row that can take focus from a script shows where focus landed. */
export const ROW_SX: SxProps<Theme> = {
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
};

/** The row's text and its action; the action moves under the text when they do not fit side by side. */
export const ROW_CONTENT_SX: SxProps<Theme> = { width: '100%', flexWrap: 'wrap', alignItems: 'center' };

/** The row's text takes the free width; `minWidth: 0` lets long words wrap instead of widening the row. */
export const ROW_TEXT_SX: SxProps<Theme> = { flex: '1 1 14rem', minWidth: 0, overflowWrap: 'anywhere' };

/** The labelled values: terms in one column, values in the other. */
export const FACTS_SX: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'max-content minmax(0, 1fr)',
  columnGap: 1.5,
  rowGap: 0.25,
  m: 0,
  mt: 0.5,
};

/** A term (`<dt>`). */
export const FACT_TERM_SX: SxProps<Theme> = { color: 'text.secondary' };

/** A known value (`<dd>`) below its limit. */
export const FACT_VALUE_SX: SxProps<Theme> = { m: 0 };

/** A value at or above its limit: bold, next to the "limit reached" text, so color is never the only sign. */
export const FACT_REACHED_SX: SxProps<Theme> = { m: 0, fontWeight: 'fontWeightBold' };

/** An unknown value ("Not specified"). */
export const FACT_UNKNOWN_SX: SxProps<Theme> = { m: 0, color: 'text.secondary' };
