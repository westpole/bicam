import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, fn, waitFor } from 'storybook/test';

import { AppHeader } from './AppHeader';

const meta = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  args: {
    onMenuClick: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const banner = canvas.getByRole('banner');
    const button = canvas.getByRole('button', { name: 'Open menu' });
    const heading = canvas.getByRole('heading', { level: 1, name: 'Bicam' });

    await expect(banner).toBeVisible();
    await expect(button).toBeVisible();
    await expect(heading).toBeVisible();

    // Button then title, on one row, and the button keeps its 48 × 48 hit area.
    const buttonBox = button.getBoundingClientRect();
    const headingBox = heading.getBoundingClientRect();
    await expect(buttonBox.right).toBeLessThanOrEqual(headingBox.left);
    await expect(
      Math.abs(buttonBox.top + buttonBox.height / 2 - (headingBox.top + headingBox.height / 2)),
    ).toBeLessThanOrEqual(4);
    await expect(buttonBox.width).toBeGreaterThanOrEqual(48);
    await expect(buttonBox.height).toBeGreaterThanOrEqual(48);

    // The icon takes the AppBar text color in either scheme.
    const icon = canvas.getByTestId('MenuIcon');
    await expect(getComputedStyle(icon).color).toBe(getComputedStyle(banner).color);

    // The menu button is the first tab stop, shows the MUI focus ring, and calls the handler.
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(button).toHaveClass('Mui-focusVisible'));
    await userEvent.click(button);
    await expect(args.onMenuClick).toHaveBeenCalledTimes(1);
  },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/**
 * Edge case: too little room for the title. The header sits in a 100px-wide box (narrower than any phone), so
 * "Bicam" overflows: the title truncates with an ellipsis while the button keeps its size, on one row.
 */
export const TruncatedTitle: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  decorators: [
    (Story) => (
      <Box sx={{ width: 100 }}>
        <Story />
      </Box>
    ),
  ],
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Open menu' });
    const heading = canvas.getByRole('heading', { level: 1, name: 'Bicam' });

    await expect(heading.scrollWidth).toBeGreaterThan(heading.clientWidth);
    await expect(getComputedStyle(heading).textOverflow).toBe('ellipsis');
    await expect(getComputedStyle(heading).whiteSpace).toBe('nowrap');

    const buttonBox = button.getBoundingClientRect();
    const headingBox = heading.getBoundingClientRect();
    await expect(buttonBox.width).toBeGreaterThanOrEqual(48);
    await expect(
      Math.abs(buttonBox.top + buttonBox.height / 2 - (headingBox.top + headingBox.height / 2)),
    ).toBeLessThanOrEqual(4);
  },
};

export const Dark: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await meta.play(context);
  },
};

/**
 * Play function for the menu-open state: the button shows ✕, reads "Close menu", is an expanded disclosure, keeps
 * its 48 × 48 hit area, and still calls the handler.
 */
const playMenuOpen = async ({ args, canvas, userEvent }: Parameters<NonNullable<Story['play']>>[0]) => {
  const banner = canvas.getByRole('banner');
  const button = canvas.getByRole('button', { name: 'Close menu' });

  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).toHaveAttribute('aria-controls', 'app-menu');
  await expect(canvas.queryByTestId('MenuIcon')).not.toBeInTheDocument();

  const icon = canvas.getByTestId('CloseIcon');
  await expect(getComputedStyle(icon).color).toBe(getComputedStyle(banner).color);

  const buttonBox = button.getBoundingClientRect();
  await expect(buttonBox.width).toBeGreaterThanOrEqual(48);
  await expect(buttonBox.height).toBeGreaterThanOrEqual(48);

  await userEvent.click(button);
  await expect(args.onMenuClick).toHaveBeenCalledTimes(1);
};

/**
 * In the app the menu panel (`#app-menu`) mounts together with the open state. The header is shown alone here, so a
 * stand-in target keeps `aria-controls` valid (axe requires the id to exist while `aria-expanded` is true).
 */
/** Id of the stand-in menu target. */
const MENU_ID = 'app-menu';

const withMenuTarget: Decorator = (Story) => (
  <>
    <Story />
    <nav id={MENU_ID} aria-label="Main menu" />
  </>
);

export const MenuOpen: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { menuOpen: true, menuId: MENU_ID },
  decorators: [withMenuTarget],
  play: playMenuOpen,
};

export const MenuOpenMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { menuOpen: true, menuId: MENU_ID },
  decorators: [withMenuTarget],
  play: playMenuOpen,
};

export const MenuOpenDark: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false }, colorScheme: 'dark' },
  args: { menuOpen: true, menuId: MENU_ID },
  decorators: [withMenuTarget],
  play: async (context) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await playMenuOpen(context);
  },
};
