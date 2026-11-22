import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import { expect, waitFor } from 'storybook/test';

import { MenuIcon } from './MenuIcon';

const meta = {
  title: 'Icons/MenuIcon',
  component: MenuIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    a11y: { test: 'error' },
  },
} satisfies Meta<typeof MenuIcon>;

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
 * Sizes scale in `em`, so the SVG stays crisp at every size. The icons follow the text color.
 *
 * @returns The icons rendered at each size.
 */
function SizesRow() {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', color: 'text.primary' }}>
      <MenuIcon fontSize="small" data-testid="icon-small" />
      <MenuIcon fontSize="medium" data-testid="icon-medium" />
      <MenuIcon fontSize="large" data-testid="icon-large" />
      <MenuIcon sx={{ fontSize: 64 }} data-testid="icon-sx" />
    </Stack>
  );
}

/**
 * Asserts that each icon renders larger than the previous one.
 *
 * @param canvasElement - The story's root element.
 */
async function expectIncreasingSizes(canvasElement: HTMLElement) {
  const widths = ['icon-small', 'icon-medium', 'icon-large', 'icon-sx'].map(
    (id) => canvasElement.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().width ?? 0,
  );

  for (let i = 1; i < widths.length; i += 1) {
    await expect(widths[i]).toBeGreaterThan(widths[i - 1]);
  }
}

export const Sizes: Story = {
  render: () => <SizesRow />,
  play: async ({ canvasElement }) => {
    await expectIncreasingSizes(canvasElement);
  },
};

export const SizesDark: Story = {
  globals: { colorScheme: 'dark' },
  render: () => <SizesRow />,
  play: async ({ canvasElement }) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await expectIncreasingSizes(canvasElement);
  },
};
