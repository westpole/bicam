import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, fn, waitFor } from 'storybook/test';

import type { BicycleInput, BicycleResult } from '@store/bicycle/types';

import { BICYCLES } from '../Home/__mocks__/bicycles';
import { AddBicycle } from './AddBicycle';

/**
 * Stands in for a store that accepts every bicycle.
 *
 * @returns A successful result.
 */
const accept = (): BicycleResult => ({ ok: true, bicycle: BICYCLES[0] });

/**
 * Stands in for a store that rejects every field, one error kind after another.
 *
 * @returns A failed result.
 */
const reject = (): BicycleResult => ({
  ok: false,
  errors: [
    { field: 'name', code: 'duplicate' },
    { field: 'company', code: 'required' },
    { field: 'model', code: 'tooLong' },
    { field: 'purchased', code: 'invalidFormat' },
    { field: 'size', code: 'invalidFormat' },
    { field: 'frameGeometry', code: 'tooLong' },
  ],
});

/**
 * Stands in for a store that rejects a field the form does not have.
 *
 * @returns A failed result.
 */
const rejectOther = (): BicycleResult => ({ ok: false, errors: [{ field: 'components', code: 'notFound' }] });

/**
 * Asserts that neither the page nor the form scrolls horizontally.
 *
 * @param canvasElement - The story root.
 */
async function expectNoOverflow(canvasElement: HTMLElement) {
  const doc = canvasElement.ownerDocument.documentElement;
  await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
}

const meta = {
  title: 'Screens/AddBicycle',
  component: AddBicycle,
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
  args: { onSubmit: fn(accept), onCancel: fn() },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { level: 2, name: 'Add bicycle' })).toBeVisible();
    await expect(canvas.getAllByRole('textbox')).toHaveLength(5);
    await expect(canvas.getByLabelText('Purchase date')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Save bicycle' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expectNoOverflow(canvasElement);
  },
} satisfies Meta<typeof AddBicycle>;

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
    // The native date picker icon follows the color scheme instead of staying black.
    await expect(getComputedStyle(context.canvas.getByLabelText('Purchase date')).colorScheme).toBe('dark');
  },
};

/** Fills every field and saves. */
export const Filled: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const input: BicycleInput = {
      name: 'Gravel Grinder',
      company: 'Canyon',
      model: 'Grizl CF SL 7',
      purchased: '2024-05-17',
      size: 'M/L',
      frameGeometry: 'Stack 594 mm, reach 393 mm',
    };
    await userEvent.type(canvas.getByRole('textbox', { name: 'Name' }), 'Gravel Grinder');
    await userEvent.type(canvas.getByRole('textbox', { name: 'Company' }), 'Canyon');
    await userEvent.type(canvas.getByRole('textbox', { name: 'Model' }), 'Grizl CF SL 7');
    await userEvent.type(canvas.getByLabelText('Purchase date'), '2024-05-17');
    await userEvent.type(canvas.getByRole('textbox', { name: 'Frame size' }), 'M/L');
    await userEvent.type(canvas.getByRole('textbox', { name: 'Frame geometry' }), 'Stack 594 mm, reach 393 mm');
    await userEvent.click(canvas.getByRole('button', { name: 'Save bicycle' }));

    await expect(args.onSubmit).toHaveBeenCalledWith(input);
    await expectNoOverflow(canvasElement);
  },
};

/**
 * Submits and checks that every field shows its error and the first one is focused.
 *
 * @param context - The story context.
 */
async function playErrors({ canvas, canvasElement, userEvent }: Parameters<NonNullable<Story['play']>>[0]) {
  await userEvent.click(canvas.getByRole('button', { name: 'Save bicycle' }));

  await expect(canvas.getByText('Another bicycle already has this name.')).toBeVisible();
  for (const textbox of canvas.getAllByRole('textbox')) {
    await expect(textbox).toHaveAttribute('aria-invalid', 'true');
  }
  await expect(canvas.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  await expectNoOverflow(canvasElement);
}

export const ErrorsDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { onSubmit: fn(reject) },
  play: playErrors,
};

export const ErrorsMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { onSubmit: fn(reject) },
  play: playErrors,
};

/**
 * Submits and checks that an error for a field the form does not have shows as a general alert.
 *
 * @param context - The story context.
 */
async function playFormError({ canvas, canvasElement, userEvent }: Parameters<NonNullable<Story['play']>>[0]) {
  await userEvent.click(canvas.getByRole('button', { name: 'Save bicycle' }));

  await expect(canvas.getByRole('alert')).toHaveTextContent('The bicycle could not be saved.');
  await expectNoOverflow(canvasElement);
}

export const FormErrorDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { onSubmit: fn(rejectOther) },
  play: playFormError,
};

export const FormErrorMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { onSubmit: fn(rejectOther) },
  play: playFormError,
};

export const FormErrorDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  args: { onSubmit: fn(rejectOther) },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await playFormError(context);
  },
};

export const ErrorsDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  args: { onSubmit: fn(reject) },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await playErrors(context);
  },
};
