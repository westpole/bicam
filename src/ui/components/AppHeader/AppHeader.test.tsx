import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { theme } from '@ui/theme';

import { AppHeader } from './AppHeader';
import type { AppHeaderProps } from './types';

/**
 * Renders the header inside the app theme.
 *
 * @param props - Optional header props.
 * @returns The Testing Library render result.
 */
function renderHeader(props: AppHeaderProps = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <AppHeader {...props} />
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

  it('renders a large, inherit-colored menu button with a translated name before the title', () => {
    renderHeader();

    const button = screen.getByRole('button', { name: 'Open menu' });
    const heading = screen.getByRole('heading', { level: 1 });

    expect(button).toHaveClass('MuiIconButton-edgeStart');
    expect(button).toHaveClass('MuiIconButton-sizeLarge');
    expect(button).toHaveClass('MuiIconButton-colorInherit');
    expect(button.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the decorative menu icon inside the button', () => {
    renderHeader();

    const icon = screen.getByTestId('MenuIcon');

    expect(screen.getByRole('button', { name: 'Open menu' })).toContainElement(icon);
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onMenuClick when the menu button is clicked', async () => {
    const onMenuClick = vi.fn();
    renderHeader({ onMenuClick });

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the menu button is clicked without a handler', async () => {
    // No-throw smoke test: the click must not throw or log an error while no drawer exists yet.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
