import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { expect, waitFor } from 'storybook/test';

import { ALL_TYPE_ROWS, LONG_ROW, ROWS } from './__mocks__/rows';
import { ComponentList } from './ComponentList';
import type { ComponentRow } from './types';

/**
 * Stands in for a screen's action slot: a button on every resting row.
 *
 * @param row - The row.
 * @returns A button, or nothing for a row in use.
 */
const renderUseNow = ({ usage }: ComponentRow) => (usage.isInUse ? null : <Button variant="outlined">Use now</Button>);

const meta = {
  title: 'Components/ComponentList',
  component: ComponentList,
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
  args: { rows: ROWS, renderAction: renderUseNow },
  play: async ({ args, canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(args.rows.length);
    for (const { component } of args.rows) {
      await expect(canvas.getAllByText(component.model)[0]).toBeVisible();
    }

    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
} satisfies Meta<typeof ComponentList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Chains with care values against their limits, one due for cleaning; resting rows have an action. */
export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async (context) => {
    await meta.play(context);
    await expect(context.canvas.getByText('1,550 of 1,500 km, limit reached')).toBeVisible();
    await expect(context.canvas.getAllByRole('button', { name: 'Use now' })).toHaveLength(2);
  },
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

/**
 * The longest model (60 characters, no spaces) and label, and the largest values, wrap on the narrowest phone, next to
 * an action.
 */
export const LongRow: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { rows: [LONG_ROW], renderAction: () => <Button variant="outlined">Use now</Button> },
};

/** One row per component type, without actions. */
export const AllTypes: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { rows: ALL_TYPE_ROWS, renderAction: undefined },
};
