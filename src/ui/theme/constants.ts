/**
 * Bicam palette tokens for the light and dark color schemes.
 *
 * Single source in code for the values in the design doc's §4.2
 * (`docs/design/app-shell-and-theme.md`). Change the palette here and in §4.2 together.
 */

/** Light color scheme tokens (teal 800 primary, deep orange 900 secondary, off-white background). */
export const LIGHT_PALETTE = {
  primary: { main: '#00695C' },
  secondary: { main: '#BF360C' },
  background: { default: '#F5F7F7', paper: '#FFFFFF' },
} as const;

/** Dark color scheme tokens (teal 300 primary, orange 300 secondary, near-black teal-tinted background). */
export const DARK_PALETTE = {
  primary: { main: '#4DB6AC' },
  secondary: { main: '#FFB74D' },
  background: { default: '#0F1414', paper: '#161D1D' },
} as const;

/** Corner radius (px) shared by all MUI components; MUI default is 4. */
export const BORDER_RADIUS = 8;
