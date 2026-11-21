import AppBar from '@mui/material/AppBar';
import { ThemeProvider, type CssVarsTheme, type Theme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { theme as baseTheme } from './index';

// `createTheme` is typed as `Theme`; with `cssVariables` on, it is also a `CssVarsTheme` at runtime.
const theme = baseTheme as Theme & CssVarsTheme;

// Expected values are copied from the design doc's §4.2 table on purpose, not imported from ./constants:
// the theme is built from ./constants, so comparing against it could never fail.
const EXPECTED = {
  light: {
    primary: '#00695C',
    secondary: '#BF360C',
    backgroundDefault: '#F5F7F7',
    backgroundPaper: '#FFFFFF',
  },
  dark: {
    primary: '#4DB6AC',
    secondary: '#FFB74D',
    backgroundDefault: '#0F1414',
    backgroundPaper: '#161D1D',
  },
} as const;

describe('theme', () => {
  it('enables CSS variables with a class-based color scheme selector', () => {
    expect(theme.vars).toBeDefined();
    expect(theme.getColorSchemeSelector('dark')).toBe('.dark &');
  });

  it.each(['light', 'dark'] as const)('defines the %s palette tokens from the design doc', (scheme) => {
    const palette = theme.colorSchemes[scheme]?.palette;
    const expected = EXPECTED[scheme];

    expect(palette?.mode).toBe(scheme);
    expect(palette?.primary.main).toBe(expected.primary);
    expect(palette?.secondary.main).toBe(expected.secondary);
    expect(palette?.background.default).toBe(expected.backgroundDefault);
    expect(palette?.background.paper).toBe(expected.backgroundPaper);
  });

  it('uses the light scheme as the default palette', () => {
    expect(theme.palette.mode).toBe('light');
    expect(theme.defaultColorScheme).toBe('light');
  });

  it('uses an 8px border radius', () => {
    expect(theme.shape.borderRadius).toBe(8);
  });

  it('configures flat primary AppBar defaults without enableColorOnDark', () => {
    const appBar = theme.components?.MuiAppBar;

    expect(appBar?.defaultProps).toMatchObject({ color: 'primary', elevation: 0 });
    expect(appBar?.defaultProps?.enableColorOnDark).toBeFalsy();
  });

  it('renders an AppBar with the theme defaults and a divider bottom border', () => {
    render(
      <ThemeProvider theme={theme}>
        <AppBar data-testid="app-bar">content</AppBar>
      </ThemeProvider>,
    );

    const appBar = screen.getByTestId('app-bar');

    expect(appBar).toHaveClass('MuiAppBar-colorPrimary');
    expect(appBar).toHaveClass('MuiPaper-elevation0');
    expect(appBar).not.toHaveClass('MuiAppBar-colorDefault');

    const style = getComputedStyle(appBar);
    expect(style.borderBottomWidth).toBe('1px');
    expect(style.borderBottomStyle).toBe('solid');
    // Resolved from the `--mui-palette-divider` CSS variable (light scheme).
    expect(style.borderBottomColor).toBe('rgba(0, 0, 0, 0.12)');
  });
});
