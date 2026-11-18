import { createTheme } from '@mui/material/styles';

/**
 * Application-wide MUI theme (Emotion is the default styling engine).
 * Extend palette, typography, and component overrides here instead of per-component styles.
 */
export const theme = createTheme({
  colorSchemes: {
    light: true,
    dark: true,
  },
});
