import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { theme } from '@ui/theme';

import { AppHeader } from './AppHeader';

/**
 * Renders the header inside the app theme.
 *
 * @returns The Testing Library render result.
 */
function renderHeader() {
  return render(
    <ThemeProvider theme={theme}>
      <AppHeader />
    </ThemeProvider>,
  );
}

describe('AppHeader', () => {
  it('renders a header banner with the translated title as the only h1', () => {
    renderHeader();

    const banner = screen.getByRole('banner');

    expect(banner.tagName).toBe('HEADER');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Bicam' })).toBeInTheDocument();
  });

  it('uses a static, flat, primary AppBar from the theme defaults', () => {
    renderHeader();

    const banner = screen.getByRole('banner');

    expect(banner).toHaveClass('MuiAppBar-positionStatic');
    expect(banner).toHaveClass('MuiAppBar-colorPrimary');
    expect(banner).toHaveClass('MuiPaper-elevation0');
  });

  it('truncates a long title instead of wrapping', () => {
    renderHeader();

    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('MuiTypography-noWrap');
  });
});
