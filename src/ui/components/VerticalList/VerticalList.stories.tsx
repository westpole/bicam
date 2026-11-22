import type { Meta, StoryObj } from '@storybook/react-vite';
import Paper from '@mui/material/Paper';
import { expect, fn, waitFor, within } from 'storybook/test';

import { VerticalList } from './VerticalList';

const meta = {
  title: 'Components/VerticalList',
  component: VerticalList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  decorators: [
    (Story) => (
      <Paper square elevation={0}>
        <Story />
      </Paper>
    ),
  ],
  args: {
    'aria-label': 'Example list',
    divided: true,
    items: [
      { id: 'chain', label: 'Chain' },
      { id: 'cassette', label: 'Cassette' },
      { id: 'brakePads', label: 'Brake pads' },
    ],
    onItemClick: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const list = canvas.getByRole('list', { name: 'Example list' });
    const rows = within(list).getAllByRole('listitem');
    await expect(rows).toHaveLength(3);

    // Rows stack top to bottom, share the left edge, span the full width, and keep a 48px touch target.
    const boxes = rows.map((row) => row.getBoundingClientRect());
    for (let i = 1; i < boxes.length; i += 1) {
      await expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 1);
      await expect(boxes[i].left).toBe(boxes[0].left);
    }
    const listWidth = list.getBoundingClientRect().width;
    for (const row of rows) {
      const buttonBox = within(row).getByRole('button').getBoundingClientRect();
      await expect(buttonBox.height).toBeGreaterThanOrEqual(48);
      await expect(Math.abs(buttonBox.width - listWidth)).toBeLessThanOrEqual(1);
    }

    await userEvent.click(canvas.getByRole('button', { name: 'Cassette' }));
    await expect(args.onItemClick).toHaveBeenCalledWith('cassette');
  },
} satisfies Meta<typeof VerticalList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/** The current row is marked with `aria-current="page"` and the MUI selected style. */
export const Selected: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { selectedId: 'cassette' },
  play: async (context) => {
    await meta.play(context);
    await expect(context.canvas.getByRole('button', { name: 'Cassette' })).toHaveAttribute('aria-current', 'page');
    await expect(context.canvas.getByRole('button', { name: 'Chain' })).not.toHaveAttribute('aria-current');
  },
};

export const Dark: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false }, colorScheme: 'dark' },
  args: { selectedId: 'chain' },
  play: async (context) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await meta.play(context);
  },
};
