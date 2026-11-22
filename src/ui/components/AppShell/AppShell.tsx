import Box from '@mui/material/Box';

import { MAIN_SX, SHELL_SX } from './constants';
import type { AppShellProps } from './types';

/**
 * Mobile-first app frame: a header row pinned to the top and a `<main>` viewport that fills the remaining
 * height and is the only element that scrolls vertically.
 *
 * `<main>` has `tabIndex={0}` so keyboard users can scroll it even when it holds no focusable content
 * (axe rule `scrollable-region-focusable`).
 *
 * @param props - See {@link AppShellProps}.
 * @returns The shell grid with the header and main viewport.
 * @example
 * <AppShell header={<AppHeader />}>{content}</AppShell>
 */
export function AppShell({ header, children }: AppShellProps) {
  return (
    <Box sx={SHELL_SX}>
      {header}
      <Box component="main" tabIndex={0} sx={MAIN_SX}>
        {children}
      </Box>
    </Box>
  );
}
