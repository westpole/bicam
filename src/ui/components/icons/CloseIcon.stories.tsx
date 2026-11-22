import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import { expect, waitFor } from 'storybook/test';

import { CloseIcon } from './CloseIcon';
import { MenuIcon } from './MenuIcon';

const meta = {
  title: 'Icons/CloseIcon',
  component: CloseIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    a11y: { test: 'error' },
  },
} satisfies Meta<typeof CloseIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single icon; use the controls to try `fontSize`, `color`, or `sx`. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg');
    await expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
  },
};

/**
 * The close icon beside the menu icon it replaces in the header: same box size, so the swap does not shift the layout.
 *
 * @returns Both icons in a row, following the text color.
 */
function MenuAndClose() {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', color: 'text.primary' }}>
      <MenuIcon data-testid="menu" />
      <CloseIcon data-testid="close" />
    </Stack>
  );
}

/**
 * Asserts that the close icon has the same rendered size as the menu icon.
 *
 * @param canvasElement - The story's root element.
 */
async function expectSameSize(canvasElement: HTMLElement) {
  const menu = canvasElement.querySelector('[data-testid="menu"]')?.getBoundingClientRect();
  const close = canvasElement.querySelector('[data-testid="close"]')?.getBoundingClientRect();
  await expect(close?.width).toBe(menu?.width);
  await expect(close?.height).toBe(menu?.height);
}

export const BesideMenuIcon: Story = {
  render: () => <MenuAndClose />,
  play: async ({ canvasElement }) => {
    await expectSameSize(canvasElement);
  },
};

export const BesideMenuIconDark: Story = {
  globals: { colorScheme: 'dark' },
  render: () => <MenuAndClose />,
  play: async ({ canvasElement }) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await expectSameSize(canvasElement);
  },
};
