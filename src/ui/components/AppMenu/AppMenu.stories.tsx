import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { MenuScreen, ScreenView } from '@store/types';

import { AppHeader } from '../AppHeader/AppHeader';
import { AppShell } from '../AppShell/AppShell';
import { AppMenu } from './AppMenu';
import { APP_MENU_ID } from './constants';

/** Story args for the menu shown inside a real shell. */
interface MenuInShellProps {
  /** Whether the menu starts open. */
  initiallyOpen: boolean;
  /** Screen marked as current in the menu. */
  activeScreen: ScreenView;
  /** Spy for option clicks. */
  onSelect: (screen: MenuScreen) => void;
}

/**
 * The menu in the `AppShell` overlay slot with the real header toggling it, so the grid cell, clipping, and icon swap
 * are realistic. Open state is local to the story; the app keeps it in the store.
 *
 * @param props - See {@link MenuInShellProps}.
 * @returns The shell with header, menu overlay, and some main content.
 */
function MenuInShell({ initiallyOpen, activeScreen, onSelect }: MenuInShellProps) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <AppShell
      header={<AppHeader menuOpen={open} menuId={APP_MENU_ID} onMenuClick={() => setOpen((value) => !value)} />}
      overlay={
        <AppMenu
          open={open}
          activeScreen={activeScreen}
          onSelect={(screen) => {
            onSelect(screen);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      }
      overlayOpen={open}
    >
      Main content behind the menu
    </AppShell>
  );
}

const meta = {
  title: 'Layout/AppMenu',
  component: MenuInShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  args: {
    initiallyOpen: false,
    activeScreen: 'home',
    onSelect: fn(),
  },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const banner = canvas.getByRole('banner');
    const main = canvasElement.querySelector('main') as HTMLElement;
    await expect(canvas.queryByRole('navigation')).not.toBeInTheDocument();

    // Open: the button turns into ✕ and the menu slides in.
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    await expect(canvas.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    const menu = await canvas.findByRole('navigation', { name: 'Main menu' });
    await expect(main).toHaveAttribute('inert');

    // Its clipping box starts at the header's bottom edge, so the sliding panel never paints over the header.
    const clip = menu.parentElement?.parentElement as HTMLElement;
    await expect(getComputedStyle(clip).overflow).toBe('hidden');
    await expect(Math.abs(clip.getBoundingClientRect().top - banner.getBoundingClientRect().bottom)).toBeLessThanOrEqual(1);

    // Once settled, the panel exactly covers <main>'s cell and focus is on the first option.
    const first = within(menu).getByRole('button', { name: 'Add bicycle' });
    await waitFor(() => expect(first).toHaveFocus());
    // MUI's Slide ends on a timer, not on `transitionend`, so under CPU load the CSS transform can still be a few
    // pixels short when focus moves. Wait for the panel to settle instead of measuring once.
    await waitFor(() => {
      const menuBox = menu.getBoundingClientRect();
      const mainBox = main.getBoundingClientRect();
      expect(Math.abs(menuBox.top - mainBox.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(menuBox.height - mainBox.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(menuBox.width - mainBox.width)).toBeLessThanOrEqual(1);
    });
    await expect(within(menu).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Add bicycle',
      'Add component',
      'Add clothes set',
      'Before ride check-in',
    ]);

    // Close with ✕: the menu slides up and unmounts, the icon returns to ≡.
    await userEvent.click(canvas.getByRole('button', { name: 'Close menu' }));
    await waitFor(() => expect(canvas.queryByRole('navigation')).not.toBeInTheDocument());
    await expect(canvas.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
    await expect(main).not.toHaveAttribute('inert');

    // Reopen and choose an option: the handler gets its id and focus returns to the menu button.
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Add component' }));
    await expect(args.onSelect).toHaveBeenCalledWith('addComponent');
    await waitFor(() => expect(canvas.queryByRole('navigation')).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Open menu' })).toHaveFocus());
  },
} satisfies Meta<typeof MenuInShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

export const Dark: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await meta.play(context);
  },
};

/** Already open with "Add clothes set" as the active screen: that option is marked current. Escape closes the menu. */
export const ActiveOption: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { initiallyOpen: true, activeScreen: 'addClothesSet' },
  play: async ({ canvas, userEvent }) => {
    const menu = await canvas.findByRole('navigation', { name: 'Main menu' });
    await expect(within(menu).getByRole('button', { current: 'page' })).toHaveAccessibleName('Add clothes set');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('navigation')).not.toBeInTheDocument());
    await expect(canvas.getByRole('button', { name: 'Open menu' })).toBeVisible();
  },
};
