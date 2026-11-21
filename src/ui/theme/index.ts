import { createTheme } from '@mui/material/styles';

import { BORDER_RADIUS, DARK_PALETTE, LIGHT_PALETTE } from './constants';

/**
 * Application-wide MUI theme (Emotion is the styling engine).
 *
 * - Colors are CSS variables (`cssVariables`) with a class-based scheme selector, so a scheme switch only swaps
 *   variables, and code below the `ThemeProvider` (for example the Storybook decorator) can force a scheme via
 *   `useColorScheme().setMode`.
 * - `light` and `dark` color schemes use the Bicam palette from `./constants`. With both schemes defined, the
 *   ThemeProvider defaults to `system` mode and follows `prefers-color-scheme` (light when unsupported).
 * - Mobile first: write `sx` responsive values with the base in `xs` and override upward (`sm`, `md`, ...).
 *   Breakpoints are the MUI defaults.
 * - `MuiAppBar` defaults to a flat `primary` bar with a 1px divider bottom border. `enableColorOnDark` stays off,
 *   so in dark mode the bar uses the dark `background.paper` surface instead of `primary.main`.
 *
 * Extend palette, typography, and component overrides here instead of per-component styles.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: { palette: LIGHT_PALETTE },
    dark: { palette: DARK_PALETTE },
  },
  shape: { borderRadius: BORDER_RADIUS },
  components: {
    MuiAppBar: {
      defaultProps: {
        color: 'primary',
        elevation: 0,
      },
      styleOverrides: {
        // `unstable_sx` resolves `divider` to its CSS variable, so the border follows the active scheme.
        root: ({ theme: t }) => t.unstable_sx({ borderBottom: 1, borderColor: 'divider' }),
      },
    },
  },
});
