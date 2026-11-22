import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Full-height two-row grid: an auto-height header row and a row that takes the remaining height.
 * `minmax(0, 1fr)` lets row 2 shrink below its content so overflow scrolls inside `<main>`, not the page.
 * `100dvh` (where supported) follows the mobile browser chrome as it shows and hides.
 */
export const SHELL_SX: SxProps<Theme> = {
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  height: '100vh',
  '@supports (height: 100dvh)': {
    height: '100dvh',
  },
  overflow: 'hidden',
};

/**
 * The only vertical scroll container. It is placed explicitly in row 2 / column 1 so an overlay can share the cell.
 * `overscrollBehaviorY` stops scroll chaining and pull-to-refresh bounce.
 * Mobile first: base padding for `xs`, more from `sm` up. The focus outline is drawn inside the box so the
 * shell's `overflow: hidden` never clips it.
 */
export const MAIN_SX: SxProps<Theme> = {
  gridRow: 2,
  gridColumn: 1,
  overflowY: 'auto',
  overscrollBehaviorY: 'contain',
  minHeight: 0,
  p: { xs: 2, sm: 3 },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: '-2px',
  },
};

/**
 * Box for the `overlay` slot: the same grid cell as `<main>` (row 2, column 1), stacked above it because it comes
 * later in the DOM and has `zIndex: 1`. `overflow: hidden` clips overlay content that moves outside the cell (the
 * menu sliding in from above never paints over the header). `pointerEvents: 'none'` keeps the box from blocking
 * clicks on `<main>` when the overlay is empty or closed; overlay content opts back in with `pointerEvents: 'auto'`.
 */
export const OVERLAY_SX: SxProps<Theme> = {
  gridRow: 2,
  gridColumn: 1,
  position: 'relative',
  overflow: 'hidden',
  minHeight: 0,
  zIndex: 1,
  pointerEvents: 'none',
};
