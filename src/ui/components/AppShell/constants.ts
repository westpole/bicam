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
 * The only vertical scroll container. `overscrollBehaviorY` stops scroll chaining and pull-to-refresh bounce.
 * Mobile first: base padding for `xs`, more from `sm` up. The focus outline is drawn inside the box so the
 * shell's `overflow: hidden` never clips it.
 */
export const MAIN_SX: SxProps<Theme> = {
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
