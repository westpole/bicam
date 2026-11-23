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

  it('marks the closed menu button as a collapsed disclosure for the app menu', () => {
    renderHeader({ menuId: 'app-menu' });

    const button = screen.getByRole('button', { name: 'Open menu' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'app-menu');
    expect(screen.queryByTestId('CloseIcon')).not.toBeInTheDocument();
  });

  it('shows the close icon and label while the menu is open', () => {
    renderHeader({ menuOpen: true, menuId: 'app-menu' });

    const button = screen.getByRole('button', { name: 'Close menu' });
    const icon = screen.getByTestId('CloseIcon');

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'app-menu');
    expect(button).toContainElement(icon);
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('MenuIcon')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
  });

  it('omits aria-controls when no menu id is given', () => {
    renderHeader({ menuOpen: true });

    expect(screen.getByRole('button', { name: 'Close menu' })).not.toHaveAttribute('aria-controls');
  });

  it('swaps back to the menu icon when the menu closes', () => {
    const { rerender } = renderHeader({ menuOpen: true });

    rerender(
      <ThemeProvider theme={theme}>
        <AppHeader menuOpen={false} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'Open menu' })).toContainElement(screen.getByTestId('MenuIcon'));
  });

  it('calls onMenuClick when the open menu button is clicked', async () => {
    const onMenuClick = vi.fn();
    renderHeader({ menuOpen: true, onMenuClick });

    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }));

    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('calls onMenuClick when the menu button is clicked', async () => {
    const onMenuClick = vi.fn();
    renderHeader({ onMenuClick });

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('omits the theme toggle when no toggle handler is given', () => {
    renderHeader();

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /theme/ })).not.toBeInTheDocument();
  });

  it('renders the theme toggle after the title, offering dark mode with a moon icon in light', () => {
    renderHeader({ onColorSchemeToggle: vi.fn() });

    const toggle = screen.getByRole('button', { name: 'Switch to dark theme' });
    const heading = screen.getByRole('heading', { level: 1 });
    const icon = screen.getByTestId('DarkModeIcon');

    expect(heading.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toggle).toHaveClass('MuiIconButton-edgeEnd');
    expect(toggle).toHaveClass('MuiIconButton-sizeLarge');
    expect(toggle).toHaveClass('MuiIconButton-colorInherit');
    expect(toggle).toContainElement(icon);
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('LightModeIcon')).not.toBeInTheDocument();
  });

  it('offers light mode with a sun icon in dark', () => {
    renderHeader({ colorScheme: 'dark', onColorSchemeToggle: vi.fn() });

    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toContainElement(
      screen.getByTestId('LightModeIcon'),
    );
    expect(screen.queryByTestId('DarkModeIcon')).not.toBeInTheDocument();
  });

  it('calls onColorSchemeToggle when the theme toggle is clicked', async () => {
    const onColorSchemeToggle = vi.fn();
    const onMenuClick = vi.fn();
    renderHeader({ onColorSchemeToggle, onMenuClick });

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(onColorSchemeToggle).toHaveBeenCalledTimes(1);
    expect(onMenuClick).not.toHaveBeenCalled();
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
