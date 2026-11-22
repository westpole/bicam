import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { theme } from '@ui/theme';

import { CloseIcon } from './CloseIcon';

describe('CloseIcon', () => {
  it('renders a decorative inline 24 × 24 SVG of an X', () => {
    render(
      <ThemeProvider theme={theme}>
        <CloseIcon />
      </ThemeProvider>,
    );

    const svg = screen.getByTestId('CloseIcon');

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveClass('MuiSvgIcon-root');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.querySelector('path')).toHaveAttribute(
      'd',
      'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    );
    expect(getComputedStyle(svg).fill).toBe('currentColor');
  });

  it('scales with an sx font size', () => {
    render(
      <ThemeProvider theme={theme}>
        <CloseIcon sx={{ fontSize: 40 }} />
      </ThemeProvider>,
    );

    expect(getComputedStyle(screen.getByTestId('CloseIcon')).fontSize).toBe('40px');
  });
});
