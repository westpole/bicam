import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, fn, waitFor, within } from 'storybook/test';

import { BICYCLES, LONG_NAME_BICYCLE, MANY_BICYCLES } from './__mocks__/bicycles';
import { Home } from './Home';

const meta = {
  title: 'Screens/Home',
  component: Home,
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
  args: { bicycles: BICYCLES, onBicycleClick: fn() },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const list = canvas.getByRole('list', { name: 'Bicycles' });
    const cards = within(list).getAllByRole('listitem');
    // Cards are named by the bicycle only; the events placeholder is hidden from assistive tech.
    await expect(within(list).getAllByRole('button')).toEqual(
      args.bicycles.map((bicycle) => within(list).getByRole('button', { name: bicycle.name })),
    );
    for (const card of cards) {
      await expect(within(card).getByTestId('DirectionsBikeIcon')).toBeVisible();
      await expect(within(card).getByText('events placeholder')).toBeVisible();
    }

    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);

    const first = args.bicycles[0];
    await userEvent.click(canvas.getByRole('button', { name: first.name }));
    await expect(args.onBicycleClick).toHaveBeenCalledWith(first.id);
  },
} satisfies Meta<typeof Home>;

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

/** The longest allowed name (40 characters) truncates on the narrowest phone. */
export const LongName: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { bicycles: [LONG_NAME_BICYCLE, ...BICYCLES] },
};

/** More cards than fit on a phone screen. */
export const ManyBicycles: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { bicycles: MANY_BICYCLES },
};

/** No bicycles: the screen renders nothing. */
export const Empty: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { bicycles: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('list')).not.toBeInTheDocument();
  },
};
