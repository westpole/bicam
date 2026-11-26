import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, fn, waitFor } from 'storybook/test';

import type { ComponentResult } from '@store/components/types';

import { COMPONENTS } from '../../ComponentList/__mocks__/components';
import { FORM_BICYCLES } from './__mocks__/bicycles';
import { AddComponent } from './AddComponent';

/**
 * Stands in for a store that accepts every component, and names a labelled chain.
 *
 * @returns A successful result.
 */
const accept = (): ComponentResult => ({ ok: true, component: { ...COMPONENTS[0], model: 'KMC X12', label: 'A' } });

/**
 * Stands in for a store that rejects every field of a chain, one error kind after another.
 *
 * @returns A failed result.
 */
const reject = (): ComponentResult => ({
  ok: false,
  errors: [
    { field: 'model', code: 'required' },
    { field: 'label', code: 'tooLong' },
    { field: 'initialDistance', code: 'invalidFormat' },
    { field: 'limits.distance', code: 'outOfRange' },
    { field: 'limits.stretch', code: 'outOfRange' },
    { field: 'limits.lubrication', code: 'invalidFormat' },
    { field: 'limits.cleaning', code: 'outOfRange' },
  ],
});

/**
 * Stands in for a store that rejects a field the form does not show.
 *
 * @returns A failed result.
 */
const rejectOther = (): ComponentResult => ({ ok: false, errors: [{ field: 'id', code: 'notFound' }] });

/** The story context passed to `play`. */
type PlayContext = Parameters<NonNullable<Story['play']>>[0];

/**
 * Asserts that the page does not scroll horizontally.
 *
 * @param canvasElement - The story root.
 */
async function expectNoOverflow(canvasElement: HTMLElement) {
  const doc = canvasElement.ownerDocument.documentElement;
  await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
}

/**
 * Waits until the preview has switched to the dark color scheme.
 *
 * @param canvasElement - The story root.
 */
async function waitForDark(canvasElement: HTMLElement) {
  await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
}

const meta = {
  title: 'Screens/AddComponent',
  component: AddComponent,
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
  args: { bicycles: [], onSubmit: fn(accept), onCancel: fn() },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { level: 2, name: 'Add component' })).toBeVisible();
    await expect(canvas.getByRole('combobox', { name: 'Type' })).toBeVisible();
    await expect(canvas.getAllByRole('textbox')).toHaveLength(4);
    await expect(canvas.getByRole('button', { name: 'Save component' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expectNoOverflow(canvasElement);
  },
} satisfies Meta<typeof AddComponent>;

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
    await waitForDark(context.canvasElement);
    await meta.play(context);
  },
};

/**
 * Chooses a chain and checks that its suggested limits fill in.
 *
 * @param context - The story context.
 */
async function playChain({ canvas, canvasElement, userEvent }: PlayContext) {
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Type' }), 'chain');

  await expect(canvas.getAllByRole('textbox')).toHaveLength(7);
  await expect(canvas.getByRole('textbox', { name: 'Replace at stretch' })).toHaveValue('0.5');
  await expect(canvas.getByRole('textbox', { name: 'Top up lubricant every' })).toHaveValue('300');
  await expect(canvas.getByRole('textbox', { name: 'Clean and relubricate every' })).toHaveValue('1500');
  await expectNoOverflow(canvasElement);
}

/** A chain shows the stretch, top-up, and cleaning limits with their suggestions. */
export const ChainDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: playChain,
};

export const ChainMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: playChain,
};

export const ChainDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitForDark(context.canvasElement);
    await playChain(context);
  },
};

/**
 * Saves a labelled chain and checks the confirmation and the cleared form.
 *
 * @param context - The story context.
 */
async function playSaved({ args, canvas, canvasElement, userEvent }: PlayContext) {
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Type' }), 'chain');
  await userEvent.type(canvas.getByRole('textbox', { name: 'Model' }), 'KMC X12');
  await userEvent.type(canvas.getByRole('textbox', { name: 'Label' }), 'A');
  await userEvent.click(canvas.getByRole('button', { name: 'Save component' }));

  await expect(args.onSubmit).toHaveBeenCalledOnce();
  await expect(canvas.getByRole('status')).toHaveTextContent('Chain KMC X12 (A) was added.');
  await expect(canvas.getByRole('combobox', { name: 'Type' })).toHaveFocus();
  await expect(canvas.getByRole('textbox', { name: 'Model' })).toHaveValue('');
  await expectNoOverflow(canvasElement);
}

export const SavedDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: playSaved,
};

export const SavedMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: playSaved,
};

export const SavedDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitForDark(context.canvasElement);
    await playSaved(context);
  },
};

/**
 * Chooses a chain, submits, and checks that every field shows its error and the first one is focused.
 *
 * @param context - The story context.
 */
async function playErrors({ canvas, canvasElement, userEvent }: PlayContext) {
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Type' }), 'chain');
  await userEvent.click(canvas.getByRole('button', { name: 'Save component' }));

  for (const textbox of canvas.getAllByRole('textbox')) {
    await expect(textbox).toHaveAttribute('aria-invalid', 'true');
  }
  await expect(canvas.getByText('Enter a number above 0 and up to 5.')).toBeVisible();
  await expect(canvas.getByRole('textbox', { name: 'Model' })).toHaveFocus();
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

export const ErrorsDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  args: { onSubmit: fn(reject) },
  play: async (context) => {
    await waitForDark(context.canvasElement);
    await playErrors(context);
  },
};

/**
 * Submits and checks that an error for a field the form does not show appears as a general alert.
 *
 * @param context - The story context.
 */
async function playFormError({ canvas, canvasElement, userEvent }: PlayContext) {
  await userEvent.click(canvas.getByRole('button', { name: 'Save component' }));

  await expect(canvas.getByRole('alert')).toHaveTextContent('The component could not be saved.');
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

/**
 * Chooses a chain for a bicycle whose chain is in use, turns "In use now" on, and checks that the one chain to
 * replace is preselected.
 *
 * @param context - The story context.
 */
async function playOnBicycle({ args, canvas, canvasElement, userEvent }: PlayContext) {
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Type' }), 'chain');
  await userEvent.type(canvas.getByRole('textbox', { name: 'Model' }), 'KMC X12');
  await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Bicycle' }), 'Gravel Grinder');

  const inUse = canvas.getByRole('switch', { name: 'In use now' });
  await expect(inUse).not.toBeChecked();
  await userEvent.click(inUse);
  await expect(inUse).toBeChecked();
  await expect(canvas.getByRole('combobox', { name: /Replaces/ })).toHaveDisplayValue('KMC X12 (A)');
  await userEvent.click(canvas.getByRole('button', { name: 'Save component' }));

  await expect(args.onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'chain' }),
    expect.objectContaining({ use: expect.objectContaining({ odometer: 1500, replaces: 'component-gravel-chain' }) }),
  );
  await expectNoOverflow(canvasElement);
}

/** With bicycles: the bicycle, "In use now", and the component to replace. */
export const OnBicycleDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { bicycles: FORM_BICYCLES },
  play: playOnBicycle,
};

export const OnBicycleMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { bicycles: FORM_BICYCLES },
  play: playOnBicycle,
};

export const OnBicycleDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  args: { bicycles: FORM_BICYCLES },
  play: async (context) => {
    await waitForDark(context.canvasElement);
    await playOnBicycle(context);
  },
};
