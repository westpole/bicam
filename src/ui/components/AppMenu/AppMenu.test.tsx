import { ThemeProvider } from '@mui/material/styles';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ScreenView } from '@store/types';
import { theme } from '@ui/theme';

import { AppMenu } from './AppMenu';
import type { AppMenuProps } from './types';

/** The theme's ease-out curve, written out so a theme change is caught here (MUI `easing.easeOut`). */
const EASE_OUT = /cubic-bezier\(0(\.0)?, 0, 0\.2, 1\)/;

/**
 * Renders the menu (with a focusable trigger before it) inside the app theme.
 *
 * @param props - Prop overrides.
 * @returns The render result plus a `setProps` helper that re-renders with new props.
 */
function renderMenu(props: Partial<AppMenuProps> = {}) {
  let current: AppMenuProps = {
    open: false,
    activeScreen: 'home',
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...props,
  };

  /**
   * Builds the tree for the given props.
   *
   * @param menuProps - Props for the menu.
   * @returns The element to render.
   */
  const ui = (menuProps: AppMenuProps) => (
    <ThemeProvider theme={theme}>
      <button type="button">Trigger</button>
      <AppMenu {...menuProps} />
    </ThemeProvider>
  );

  const result = render(ui(current));

  return {
    ...result,
    /**
     * Re-renders with the given prop overrides.
     *
     * @param next - Prop overrides to merge into the current props.
     */
    setProps(next: Partial<AppMenuProps>) {
      current = { ...current, ...next };
      result.rerender(ui(current));
    },
  };
}

/**
 * Returns the menu panel once it is mounted.
 *
 * @returns The navigation landmark.
 */
function getMenu() {
  return screen.getByRole('navigation', { name: 'Main menu' });
}

describe('AppMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing focusable or landmark-like while closed', () => {
    renderMenu();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists the four options in order when opened', async () => {
    const { setProps } = renderMenu();

    setProps({ open: true });

    const menu = getMenu();
    expect(menu).toHaveAttribute('id', 'app-menu');
    expect(menu.tagName).toBe('NAV');
    expect(within(menu).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Add bicycle',
      'Add component',
      'Add clothes set',
      'Before ride check-in',
    ]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add bicycle' })).toHaveFocus());
  });

  it('slides down on enter with the ease-out curve and the entering duration', async () => {
    const { setProps } = renderMenu();

    setProps({ open: true });

    // Slide sets the panel's inline transition synchronously as the enter transition starts.
    expect(getMenu().style.transition).toMatch(EASE_OUT);
    expect(getMenu().style.transition).toContain('225ms');
    expect(getMenu().style.transition).toContain('transform');
    // Let the enter transition finish inside the test, so its focus update is not left pending.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add bicycle' })).toHaveFocus());
  });

  it('slides up on exit with the ease-out curve and the leaving duration, then unmounts', async () => {
    const { setProps } = renderMenu({ open: true });
    const menu = getMenu();

    setProps({ open: false });

    expect(menu.style.transition).toMatch(EASE_OUT);
    expect(menu.style.transition).toContain('195ms');
    expect(menu.style.transform).toMatch(/^translateY\(-?\d/);
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
  });

  it('opens and closes without motion when the user prefers reduced motion', async () => {
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) satisfies MediaQueryList,
    );
    const { setProps } = renderMenu();

    setProps({ open: true });
    await waitFor(() => expect(getMenu().style.transition).toContain('0ms'));

    setProps({ open: false });
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('calls onSelect with the chosen screen', async () => {
    const onSelect = vi.fn();
    renderMenu({ open: true, onSelect });

    await userEvent.click(screen.getByRole('button', { name: 'Add clothes set' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('addClothesSet');
  });

  it.each<[ScreenView, string | null]>([
    ['addComponent', 'Add component'],
    ['home', null],
  ])('marks the option for the active screen %s as current', (activeScreen, current) => {
    renderMenu({ open: true, activeScreen });

    const currentButton = screen.queryByRole('button', { current: 'page' });

    if (current === null) {
      expect(currentButton).not.toBeInTheDocument();
    } else {
      expect(currentButton).toHaveAccessibleName(current);
    }
  });

  it('calls onClose on Escape while open, and not while closed', async () => {
    const onClose = vi.fn();
    const { setProps } = renderMenu({ onClose });

    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    setProps({ open: true });
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('a');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the first option after opening and back to the trigger after closing', async () => {
    const { setProps } = renderMenu();
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await userEvent.click(trigger);
    expect(trigger).toHaveFocus();

    setProps({ open: true });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add bicycle' })).toHaveFocus());

    setProps({ open: false });
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('does not steal focus the user moved elsewhere during the enter slide', async () => {
    const { setProps } = renderMenu();
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await userEvent.click(trigger);

    setProps({ open: true });
    // Mid-slide, the user moves focus into the menu's second option.
    await userEvent.tab();
    await userEvent.tab();
    const second = screen.getByRole('button', { name: 'Add component' });
    expect(second).toHaveFocus();

    // Wait past the 225ms enter transition: focus stays where the user put it.
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(second).toHaveFocus();
  });

  it('leaves focus alone after closing when it already moved outside the menu', async () => {
    const { setProps } = renderMenu();
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    setProps({ open: true });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add bicycle' })).toHaveFocus());
    await userEvent.click(trigger);

    setProps({ open: false });
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('does not restore focus to an element that was removed while the menu was open', async () => {
    const { setProps } = renderMenu();
    // A trigger outside React's tree, so removing it does not interfere with React's own DOM bookkeeping.
    const external = document.createElement('button');
    external.textContent = 'External';
    document.body.append(external);
    external.focus();

    setProps({ open: true });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add bicycle' })).toHaveFocus());
    external.remove();

    setProps({ open: false });
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(external).not.toHaveFocus();
    expect(screen.getByRole('button', { name: 'Trigger' })).not.toHaveFocus();
  });
});
