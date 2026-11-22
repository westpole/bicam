import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useColorScheme } from '@mui/material/styles';

import '../src/i18n/config';
import { theme } from '../src/ui/theme';

/** Color scheme modes offered by the Storybook toolbar. */
const COLOR_SCHEME_MODES = ['light', 'dark', 'system'] as const;
type ColorSchemeMode = (typeof COLOR_SCHEME_MODES)[number];

/**
 * Narrows an untrusted `colorScheme` global (it can come from the URL) to a known mode.
 *
 * @param value - The raw global value.
 * @returns The value when it is a known mode, otherwise `'system'`.
 */
function toColorSchemeMode(value: unknown): ColorSchemeMode {
  return COLOR_SCHEME_MODES.find((mode) => mode === value) ?? 'system';
}

/**
 * Applies the toolbar's color scheme to MUI. Must render below `ThemeProvider`, because `useColorScheme` only works
 * there. `setMode` runs in an effect (never during render) and always runs (a missing or unknown global becomes
 * `system`), so a mode MUI saved to `localStorage` for an earlier story never leaks into the next one.
 *
 * @param props.mode - The normalized `colorScheme` global.
 * @returns Nothing; it only syncs the mode.
 */
function ColorSchemeSync({ mode }: { mode: ColorSchemeMode }) {
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  return null;
}

const preview: Preview = {
  globalTypes: {
    colorScheme: {
      description: 'MUI color scheme',
      toolbar: {
        title: 'Color scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'system', title: 'System', icon: 'browser' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    colorScheme: 'system',
  },
  decorators: [
    (Story, context) => (
      <ThemeProvider theme={theme}>
        <ColorSchemeSync mode={toColorSchemeMode(context.globals.colorScheme)} />
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo', // change to 'error' to fail CI on a11y violations
    },
  },
};

export default preview;
