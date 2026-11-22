import type { SxProps, Theme } from '@mui/material/styles';

/** The `<ul>`: a plain vertical stack with no bullets; `<main>` already provides padding and scrolling. */
export const LIST_SX: SxProps<Theme> = {
  listStyle: 'none',
  m: 0,
  p: 0,
};

/** Vertical gap between cards, in theme spacing units (12px). */
export const LIST_SPACING = 1.5;

/** The card `Paper`: clips its content to the theme's rounded corners. */
export const CARD_SX: SxProps<Theme> = {
  overflow: 'hidden',
};

/** Card content: the media on the left, the text column on the right. */
export const CARD_CONTENT_SX: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  p: 2,
};

/** Media slot: never shrinks, so long titles truncate instead of squeezing the image. */
export const MEDIA_SX: SxProps<Theme> = {
  display: 'flex',
  flexShrink: 0,
};

/** Text column: `minWidth: 0` lets the title truncate inside the flex row. */
export const TEXT_COLUMN_SX: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
};

/** Second content row, reserved for event icons; keeps its height while empty so cards do not change size later. */
export const SECONDARY_ROW_SX: SxProps<Theme> = {
  minHeight: 24,
};
