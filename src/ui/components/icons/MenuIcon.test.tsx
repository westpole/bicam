import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { theme } from '@ui/theme';

import { MenuIcon } from './MenuIcon';

describe('MenuIcon', () => {
  it('renders a decorative inline 24 × 24 SVG of three bars', () => {
    render(
      <ThemeProvider theme={theme}>
        <MenuIcon />
      </ThemeProvider>,
    );

    const svg = screen.getByTestId('MenuIcon');

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.querySelector('path')).toHaveAttribute('d', 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z');
    expect(getComputedStyle(svg).fill).toBe('currentColor');
  });

  it('renders an MUI SvgIcon root', () => {
    render(
      <ThemeProvider theme={theme}>
        <MenuIcon />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('MenuIcon')).toHaveClass('MuiSvgIcon-root');
  });

  it.each(['small', 'medium', 'large'] as const)('applies fontSize="%s"', (fontSize) => {
    render(
      <ThemeProvider theme={theme}>
        <MenuIcon fontSize={fontSize} />
      </ThemeProvider>,
    );

    const expectedClass = `MuiSvgIcon-fontSize${fontSize[0].toUpperCase()}${fontSize.slice(1)}`;
    expect(screen.getByTestId('MenuIcon')).toHaveClass(expectedClass);
  });

  it('scales with an sx font size', () => {
    render(
      <ThemeProvider theme={theme}>
        <MenuIcon sx={{ fontSize: 40 }} />
      </ThemeProvider>,
    );

    expect(getComputedStyle(screen.getByTestId('MenuIcon')).fontSize).toBe('40px');
  });
});
