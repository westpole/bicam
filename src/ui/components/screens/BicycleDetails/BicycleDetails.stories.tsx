import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, waitFor } from 'storybook/test';

import { BicycleDetails } from './BicycleDetails';

const meta = {
  title: 'Screens/BicycleDetails',
  component: BicycleDetails,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  decorators: [
    // Same padding `<main>` gives its content in the app.
    (Story) => (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Story />
      </Box>
    ),
  ],
  args: { name: 'Gravel Grinder' },
  play: async ({ args, canvas, canvasElement }) => {
    const heading = canvas.getByRole('heading', { level: 2, name: args.name });
    await expect(heading).toBeVisible();
    await expect(canvas.getByText('This screen is coming soon.')).toBeVisible();

    // Long names wrap instead of overflowing, even on the narrowest viewport.
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth);
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
} satisfies Meta<typeof BicycleDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

export const Dark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await meta.play(context);
  },
};

/** The longest allowed name (40 characters) on the narrowest phone. */
export const LongName: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { name: 'Commuter with a very long name for tests' },
};
