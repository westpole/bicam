import Box from '@mui/material/Box';

import { MAIN_SX, OVERLAY_SX, SHELL_SX } from './constants';
import type { AppShellProps } from './types';

/**
 * Mobile-first app frame: a header row pinned to the top and a `<main>` viewport that fills the remaining
 * height and is the only element that scrolls vertically.
 *
 * `<main>` has `tabIndex={0}` so keyboard users can scroll it even when it holds no focusable content
 * (axe rule `scrollable-region-focusable`).
 *
 * An optional `overlay` shares `<main>`'s grid cell and is stacked above it. While `overlayOpen` is `true`, `<main>`
 * is `inert`, so it cannot be focused, clicked, or read by assistive tech behind the overlay.
 *
 * @param props - See {@link AppShellProps}.
 * @returns The shell grid with the header, the main viewport, and the optional overlay.
 * @example
 * <AppShell header={<AppHeader />} overlay={<AppMenu open={open} … />} overlayOpen={open}>{content}</AppShell>
 */
export function AppShell({ header, children, overlay, overlayOpen = false }: AppShellProps) {
  return (
    <Box sx={SHELL_SX}>
      {header}
      <Box component="main" tabIndex={0} inert={overlayOpen} sx={MAIN_SX}>
        {children}
      </Box>
      {overlay != null && <Box sx={OVERLAY_SX}>{overlay}</Box>}
    </Box>
  );
}
