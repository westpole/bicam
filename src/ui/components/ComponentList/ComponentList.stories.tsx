import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, waitFor } from 'storybook/test';

import { ALL_TYPE_COMPONENTS, COMPONENTS, LONG_MODEL_COMPONENT } from './__mocks__/components';
import { ComponentList } from './ComponentList';

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
  args: { components: COMPONENTS },
  play: async ({ args, canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(args.components.length);
    for (const { model } of args.components) {
      await expect(canvas.getByText(model)).toBeVisible();
    }

    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
} satisfies Meta<typeof ComponentList>;

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

/** The longest allowed model (60 characters, no spaces) wraps on the narrowest phone. */
export const LongModel: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { components: [LONG_MODEL_COMPONENT, ...COMPONENTS] },
};

/** One row per component type. */
export const AllTypes: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { components: ALL_TYPE_COMPONENTS },
};
