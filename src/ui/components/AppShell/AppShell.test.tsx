import type { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { theme } from '@ui/theme';

import { AppHeader } from '../AppHeader/AppHeader';
import { AppShell } from './AppShell';

/**
 * Renders the shell with the app header inside the app theme.
 *
 * @param children - Content for the main viewport.
 * @returns The Testing Library render result.
 */
function renderShell(children?: ReactNode) {
  return render(
    <ThemeProvider theme={theme}>
      <AppShell header={<AppHeader />}>{children}</AppShell>
    </ThemeProvider>,
  );
}

describe('AppShell', () => {
  it('renders the header banner before the main landmark', () => {
    renderShell();

    const banner = screen.getByRole('banner');
    const main = screen.getByRole('main');

    expect(banner).toContainElement(screen.getByRole('heading', { level: 1, name: 'Bicam' }));
    expect(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders children inside main', () => {
    renderShell(<p>Journal entry</p>);

    expect(screen.getByRole('main')).toHaveTextContent('Journal entry');
  });

  it('makes main keyboard-focusable', () => {
    renderShell();

    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '0');
  });

  it('makes main the scroll container', () => {
    renderShell();

    const style = getComputedStyle(screen.getByRole('main'));

    expect(style.overflowY).toBe('auto');
    expect(style.minHeight).toMatch(/^0(px)?$/);
  });

  it('lays the shell out as a two-row grid that clips overflow', () => {
    renderShell();

    // The shell is the main landmark's parent; it has no role of its own.
    const shell = screen.getByRole('main').parentElement as HTMLElement;
    const style = getComputedStyle(shell);

    expect(style.display).toBe('grid');
    expect(style.gridTemplateRows).toBe('auto minmax(0, 1fr)');
    expect(style.overflow).toBe('hidden');
  });
});
