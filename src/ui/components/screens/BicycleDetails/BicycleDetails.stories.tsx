import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { BicycleResult } from '@store/bicycle/types';
import type { BicycleComponentResult } from '@store/types';
import {
  ALL_TYPE_COMPONENTS,
  COMPONENTS,
  LONG_MODEL_COMPONENT,
  SPARE_COMPONENTS,
} from '@ui/components/ComponentList/__mocks__/components';

import { BICYCLES, LONG_NAME_BICYCLE } from '../Home/__mocks__/bicycles';
import { IDENTICAL_CHAIN_SPARES, SPARES } from './__mocks__/spareComponents';
import { BicycleDetails } from './BicycleDetails';

/**
 * Stands in for a store that accepts every new component.
 *
 * @returns A successful result.
 */
const acceptNew = (): BicycleComponentResult => ({ ok: true, component: COMPONENTS[0] });

/**
 * Stands in for a store that accepts every spare component.
 *
 * @returns A successful result.
 */
const acceptSpare = (): BicycleComponentResult => ({ ok: true, component: SPARE_COMPONENTS[0] });

/**
 * Stands in for a store that accepts every odometer reading.
 *
 * @returns A successful result.
 */
const acceptOdometer = (): BicycleResult => ({ ok: true, bicycle: BICYCLES[0] });

/**
 * Stands in for a store that rejects a total below the latest usage boundary, and the date.
 *
 * @returns A failed result.
 */
const rejectOdometer = (): BicycleResult => ({
  ok: false,
  errors: [
    { field: 'odometer', code: 'outOfRange' },
    { field: 'odometerDate', code: 'invalidFormat' },
  ],
});

/**
 * Stands in for a store that rejects both fields of a new component.
 *
 * @returns A failed result.
 */
const rejectFields = (): BicycleComponentResult => ({
  ok: false,
  errors: [
    { field: 'type', code: 'required' },
    { field: 'model', code: 'tooLong' },
  ],
});

/**
 * Stands in for a store whose bicycle has no room left.
 *
 * @returns A failed result.
 */
const rejectFull = (): BicycleComponentResult => ({ ok: false, errors: [{ field: 'components', code: 'tooMany' }] });

/**
 * Asserts that the page does not scroll horizontally.
 *
 * @param canvasElement - The story root.
 */
async function expectNoOverflow(canvasElement: HTMLElement) {
  const doc = canvasElement.ownerDocument.documentElement;
  await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
}

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
  args: {
    bicycle: {
      ...BICYCLES[0],
      purchased: '2024-05-17',
      size: 'M/L',
      frameGeometry: 'Stack 594 mm, reach 393 mm\nHead tube angle 71°',
      odometer: 3100.5,
      odometerDate: '2026-04-12',
    },
    components: COMPONENTS,
    spareComponents: SPARES,
    minimumOdometer: 1500,
    onSetOdometer: fn(acceptOdometer),
    onCreateComponent: fn(acceptNew),
    onIncludeComponent: fn(acceptSpare),
  },
  play: async ({ args, canvas, canvasElement }) => {
    const heading = canvas.getByRole('heading', { level: 2, name: args.bicycle.name });
    await expect(heading).toBeVisible();
    await expect(canvas.getAllByRole('term')).toHaveLength(7);
    await expect(canvas.getByRole('region', { name: 'Distance' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Update distance' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Include component' })).toBeVisible();

    if (args.components.length > 0) {
      const list = canvas.getByRole('list', { name: 'Components' });
      await expect(within(list).getAllByRole('listitem')).toHaveLength(args.components.length);
    } else {
      await expect(canvas.getByText('No components on this bicycle yet.')).toBeVisible();
    }

    // Long text wraps instead of overflowing, even on the narrowest viewport.
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth);
    await expectNoOverflow(canvasElement);
  },
} satisfies Meta<typeof BicycleDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Opens the dialog, which renders in a portal outside the story canvas.
 *
 * @param context - The story context.
 * @returns Queries bound to the dialog.
 */
async function openDialog(context: Parameters<NonNullable<Story['play']>>[0]) {
  return openNamedDialog(context, 'Include component', 'Include component');
}

/**
 * Opens a dialog from its button. Dialogs render in a portal outside the story canvas.
 *
 * @param context - The story context.
 * @param button - The name of the button that opens it.
 * @param name - The dialog's accessible name.
 * @returns Queries bound to the dialog.
 */
async function openNamedDialog(
  { canvas, canvasElement, userEvent }: Parameters<NonNullable<Story['play']>>[0],
  button: string,
  name: string,
) {
  await userEvent.click(canvas.getByRole('button', { name: button }));
  const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog', { name });
  // The dialog fades in; wait for the end, so the a11y check sees the final colors.
  await waitFor(() => expect(getComputedStyle(dialog.parentElement as HTMLElement).opacity).toBe('1'));

  return within(dialog);
}

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

/** A bicycle with only the required fields and no components. */
export const Empty: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { bicycle: BICYCLES[1], components: [] },
};

/** The longest allowed name (40 characters) and model (60 characters, no spaces) on the narrowest phone. */
export const LongTexts: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: {
    bicycle: { ...LONG_NAME_BICYCLE, frameGeometry: 'geometry'.repeat(60) },
    components: [LONG_MODEL_COMPONENT],
  },
};

/** More components than fit on a phone screen. */
export const ManyComponents: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { components: ALL_TYPE_COMPONENTS },
};

/** The dialog with spare components to choose from. */
export const IncludeDialog: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async (context) => {
    const dialog = await openDialog(context);
    await expect(dialog.getByRole('combobox', { name: 'Component' })).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Type' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Model' })).toBeVisible();
    await expectNoOverflow(context.canvasElement);
  },
};

/** A spare component with a long model is chosen, on the narrowest phone. */
export const IncludeDialogSpareMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { spareComponents: [{ component: { ...LONG_MODEL_COMPONENT, label: 'L'.repeat(20) }, distance: 123456.7 }] },
  play: async (context) => {
    const dialog = await openDialog(context);
    await context.userEvent.selectOptions(dialog.getByRole('combobox', { name: 'Component' }), LONG_MODEL_COMPONENT.id);
    await expect(dialog.queryByRole('textbox')).not.toBeInTheDocument();
    const content = dialog.getByRole('combobox').closest('.MuiDialogContent-root') as HTMLElement;
    await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
    await expectNoOverflow(context.canvasElement);
  },
};

/**
 * Opens the dialog with three identical chains and checks that their options tell them apart.
 *
 * @param context - The story context.
 */
async function playIdenticalSpares(context: Parameters<typeof openDialog>[0]) {
  const dialog = await openDialog(context);
  const options = within(dialog.getByRole('combobox', { name: 'Component' })).getAllByRole('option');

  await expect(options.map((option) => option.textContent)).toEqual([
    'New component',
    'Chain: KMC X12 (A), 1,500 km',
    'Chain: KMC X12 (B), 1,600 km',
    'Chain: KMC X12 (C), 0 km',
  ]);
  await expectNoOverflow(context.canvasElement);
}

/** Three identical chains, told apart by label and distance. */
export const IncludeDialogIdenticalSparesDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { spareComponents: IDENTICAL_CHAIN_SPARES },
  play: playIdenticalSpares,
};

export const IncludeDialogIdenticalSparesMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { spareComponents: IDENTICAL_CHAIN_SPARES },
  play: playIdenticalSpares,
};

/** Without spare components only a new one can be created. */
export const IncludeDialogDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  args: { spareComponents: [] },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    const dialog = await openDialog(context);
    await expect(dialog.queryByRole('combobox', { name: 'Component' })).not.toBeInTheDocument();
    await expect(dialog.getByRole('combobox', { name: 'Type' })).toBeVisible();
  },
};

/** A rejected new component: both fields show their error and the first one has focus. */
export const IncludeDialogErrors: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { onCreateComponent: fn(rejectFields) },
  play: async (context) => {
    const dialog = await openDialog(context);
    await context.userEvent.click(dialog.getByRole('button', { name: 'Include' }));
    await expect(dialog.getByText('This field is required.')).toBeVisible();
    await expect(dialog.getByText('Use 60 characters or fewer.')).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Type' })).toHaveFocus();
  },
};

/** The same errors stay readable in the dark scheme. */
export const IncludeDialogErrorsDark: Story = {
  ...IncludeDialogErrors,
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await IncludeDialogErrors.play?.(context);
  },
};

/** The bicycle has no room for another component. */
export const IncludeDialogFull: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { onCreateComponent: fn(rejectFull) },
  play: async (context) => {
    const dialog = await openDialog(context);
    await context.userEvent.click(dialog.getByRole('button', { name: 'Include' }));
    await expect(dialog.getByRole('alert')).toHaveTextContent(
      'This bicycle already has the maximum of 100 components.',
    );
  },
};

/**
 * Opens the update distance dialog and checks its fields.
 *
 * @param context - The story context.
 * @returns Queries bound to the dialog.
 */
async function openDistanceDialog(context: Parameters<NonNullable<Story['play']>>[0]) {
  const dialog = await openNamedDialog(context, 'Update distance', 'Update distance');
  await expect(dialog.getByRole('radio', { name: 'Set total' })).toBeChecked();
  await expect(dialog.getByRole('textbox', { name: 'Total distance' })).toHaveFocus();
  await expect(dialog.getByLabelText('Date')).not.toHaveValue('');
  await expectNoOverflow(context.canvasElement);

  return dialog;
}

/** The update distance dialog, set to a new total. */
export const UpdateDistanceDialogDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async (context) => {
    await openDistanceDialog(context);
  },
};

/** The update distance dialog on the narrowest viewport, set to add a ride. */
export const UpdateDistanceDialogRideMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async (context) => {
    const dialog = await openDistanceDialog(context);

    await context.userEvent.click(dialog.getByRole('radio', { name: 'Add ride' }));
    await context.userEvent.type(dialog.getByRole('textbox', { name: 'Ride distance' }), '42.2');

    await expect(dialog.getByText('Added to the current total of 3,100.5 km.')).toBeVisible();
    await context.userEvent.click(dialog.getByRole('button', { name: 'Save' }));
    await expect(context.args.onSetOdometer).toHaveBeenCalledWith(expect.objectContaining({ odometer: 3142.7 }));
  },
};

/** The update distance dialog in dark mode, for the a11y contrast check. */
export const UpdateDistanceDialogDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await openDistanceDialog(context);
  },
};

/** A total below the latest usage boundary names the lowest allowed reading. */
export const UpdateDistanceDialogErrors: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { onSetOdometer: fn(rejectOdometer) },
  play: async (context) => {
    const dialog = await openDistanceDialog(context);

    await context.userEvent.type(dialog.getByRole('textbox', { name: 'Total distance' }), '1000');
    await context.userEvent.click(dialog.getByRole('button', { name: 'Save' }));

    await expect(dialog.getByText('The total must be from 1,500 to 500,000 km.')).toBeVisible();
    await expect(dialog.getByText('Enter a complete date with a four-digit year, or leave it empty.')).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Total distance' })).toHaveFocus();
    await expectNoOverflow(context.canvasElement);
  },
};

/** The rejected update distance dialog in dark mode, for the contrast of the error text. */
export const UpdateDistanceDialogErrorsDark: Story = {
  ...UpdateDistanceDialogErrors,
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await UpdateDistanceDialogErrors.play?.(context);
  },
};
