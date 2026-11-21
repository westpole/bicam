import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { App } from './App';

const meta = {
  title: 'Screens/App',
  component: App,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Bicam' })).toBeVisible();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Bicam' })).toBeVisible();
  },
};

export const Dark: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false }, colorScheme: 'dark' },
  play: async ({ canvas, canvasElement }) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await expect(canvas.getByRole('heading', { level: 1, name: 'Bicam' })).toBeVisible();
  },
};
