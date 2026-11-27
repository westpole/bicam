import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, fn, waitFor, within } from 'storybook/test';

import type { BicycleResult } from '@store/bicycle/types';
import type {
  ComponentHistoryInput,
  ComponentId,
  ComponentUsageResult,
  StartRange,
} from '@store/components/types';
import type { BicycleComponentResult } from '@store/types';
import {
  ALL_TYPE_COMPONENTS,
  COMPONENTS,
  LONG_MODEL_COMPONENT,
  SPARE_COMPONENTS,
} from '@ui/components/ComponentList/__mocks__/components';
import {
  CHAIN_IN_USE_ROW,
  CHAIN_RESTING_ROW,
  LONG_ROW,
  ROWS,
  toRow,
  WHEEL_IN_USE_ROW,
} from '@ui/components/ComponentList/__mocks__/rows';

import { BICYCLES, LONG_NAME_BICYCLE } from '../Home/__mocks__/bicycles';
import { acceptCare } from './__mocks__/careEntry';
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
 * Stands in for a store that accepts every start.
 *
 * @returns A successful result.
 */
const acceptStart = (): ComponentUsageResult => ({ ok: true, component: CHAIN_RESTING_ROW.component });

/**
 * Stands in for a store that rejects a reading before the replaced chain's start.
 *
 * @returns A failed result.
 */
const rejectStart = (): ComponentUsageResult => ({ ok: false, errors: [{ field: 'odometer', code: 'outOfRange' }] });

/**
 * Stands in for `getStartRange` on a bicycle at 3,100.5 km whose chain went in use at 1,500 km.
 *
 * @returns The accepted readings.
 */
const startRange = (): StartRange => ({ min: 1500, max: 3100.5 });

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
    rows: ROWS,
    spareComponents: SPARES,
    minimumOdometer: 1500,
    onSetOdometer: fn(acceptOdometer),
    onCreateComponent: fn(acceptNew),
    onIncludeComponent: fn(acceptSpare),
    onStartComponent: fn(acceptStart),
    getStartRange: fn(startRange),
    onLogCare: fn((_componentId: ComponentId, input: ComponentHistoryInput) => acceptCare(input)),
  },
  play: async ({ args, canvas, canvasElement }) => {
    const heading = canvas.getByRole('heading', { level: 2, name: args.bicycle.name });
    await expect(heading).toBeVisible();
    // The bicycle's own terms; component rows have their own.
    await expect(canvas.getAllByRole('term').filter((term) => !term.closest('li'))).toHaveLength(7);
    await expect(canvas.getByRole('region', { name: 'Distance' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Update distance' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Include component' })).toBeVisible();

    const inUseCount = args.rows.filter(({ usage }) => usage.isInUse).length;
    const restingCount = args.rows.length - inUseCount;

    for (const [name, count] of [
      ['In use', inUseCount],
      ['Resting', restingCount],
    ] as const) {
      if (count > 0) {
        await expect(within(canvas.getByRole('list', { name })).getAllByRole('listitem')).toHaveLength(count);
      } else {
        await expect(canvas.queryByRole('list', { name })).not.toBeInTheDocument();
      }
    }

    if (args.rows.length === 0) {
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
  args: { bicycle: BICYCLES[1], rows: [] },
};

/** The longest allowed name (40 characters) and model (60 characters, no spaces) on the narrowest phone. */
export const LongTexts: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: {
    bicycle: { ...LONG_NAME_BICYCLE, frameGeometry: 'geometry'.repeat(60) },
    rows: [LONG_ROW, toRow({ ...LONG_MODEL_COMPONENT, label: 'L'.repeat(20) }, { distance: 123456.7 })],
  },
};

/** More components than fit on a phone screen, all in use. */
export const ManyComponents: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: {
    rows: ALL_TYPE_COMPONENTS.map((component) =>
      toRow(component, { isInUse: true, distance: 1234.5, distanceSinceInstalled: 1234.5 }),
    ),
  },
};

/**
 * Three identical chains and none in use, as the migration leaves a bicycle that listed three: a notice asks the rider
 * to choose one.
 */
export const NoneInUse: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: {
    rows: [
      toRow({ ...CHAIN_RESTING_ROW.component, id: 'chain-a', label: 'A' }),
      toRow({ ...CHAIN_RESTING_ROW.component, id: 'chain-b', label: 'B' }),
      toRow({ ...CHAIN_RESTING_ROW.component, id: 'chain-c', label: 'C' }),
      WHEEL_IN_USE_ROW,
    ],
  },
  play: async (context) => {
    await meta.play(context);
    await expect(context.canvas.getByRole('alert')).toHaveTextContent(
      'Chain: none in use. Choose one under Resting with Use now.',
    );
    await expect(context.canvas.getAllByRole('button', { name: /^Use now/ })).toHaveLength(3);
  },
};

/**
 * Opens the use dialog for resting chain B, whose type is full, and checks its defaults.
 *
 * @param context - The story context.
 * @returns Queries bound to the dialog.
 */
async function openUseDialog(context: Parameters<NonNullable<Story['play']>>[0]) {
  const dialog = await openNamedDialog(context, 'Use now: Chain Shimano CN-M8100 (B)', 'Put component in use');
  await expect(dialog.getByRole('combobox', { name: 'Replaces' })).toHaveValue(CHAIN_IN_USE_ROW.component.id);
  await expect(dialog.getByRole('textbox', { name: 'Odometer' })).toHaveValue('3100.5');
  await expect(dialog.getByLabelText('Date')).not.toHaveValue('');
  await expectNoOverflow(context.canvasElement);

  return dialog;
}

/** The use dialog for a swap: the chain in use is preselected, and the reading defaults to the odometer. */
export const UseDialogDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async (context) => {
    const dialog = await openUseDialog(context);

    await context.userEvent.click(dialog.getByRole('button', { name: 'Use now' }));
    await expect(context.args.onStartComponent).toHaveBeenCalledWith(
      CHAIN_RESTING_ROW.component.id,
      expect.objectContaining({ odometer: 3100.5, replaces: CHAIN_IN_USE_ROW.component.id }),
    );
  },
};

export const UseDialogMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async (context) => {
    await openUseDialog(context);
  },
};

/** The use dialog in dark mode, for the a11y contrast check. */
export const UseDialogDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await openUseDialog(context);
  },
};

/** A reading before the replaced chain's start names the readings the store accepts. */
export const UseDialogErrors: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { onStartComponent: fn(rejectStart) },
  play: async (context) => {
    const dialog = await openUseDialog(context);
    const odometer = dialog.getByRole('textbox', { name: 'Odometer' });

    await context.userEvent.clear(odometer);
    await context.userEvent.type(odometer, '1000');
    await context.userEvent.click(dialog.getByRole('button', { name: 'Use now' }));

    await expect(dialog.getByText('The odometer must be from 1,500 to 3,100.5 km.')).toBeVisible();
    await expect(odometer).toHaveFocus();
    await expectNoOverflow(context.canvasElement);
  },
};

/** The rejected use dialog in dark mode, for the contrast of the error text. */
export const UseDialogErrorsDark: Story = {
  ...UseDialogErrors,
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await UseDialogErrors.play?.(context);
  },
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

/**
 * Opens the log care dialog for chain A, in use, and checks its defaults.
 *
 * @param context - The story context.
 * @returns Queries bound to the dialog.
 */
async function openCareDialog(context: Parameters<NonNullable<Story['play']>>[0]) {
  const dialog = await openNamedDialog(context, 'Log care: Chain Shimano CN-M8100 (A)', 'Log chain care');
  await expect(dialog.getByRole('radio', { name: 'Topped up' })).toBeChecked();
  await expect(dialog.getByRole('combobox', { name: /^Lubricant/ })).toHaveValue('wax');
  await expect(dialog.getByRole('textbox', { name: 'Odometer' })).toHaveValue('3100.5');
  await expect(dialog.getByRole('textbox', { name: 'Chain distance' })).toHaveValue('2900');
  await expectNoOverflow(context.canvasElement);

  return dialog;
}

/** The log care dialog for a chain in use: a top-up with the last lubricant, at the current odometer. */
export const LogCareDialogDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async (context) => {
    const dialog = await openCareDialog(context);

    await context.userEvent.click(dialog.getByRole('button', { name: 'Save' }));
    await expect(context.args.onLogCare).toHaveBeenCalledWith(
      CHAIN_IN_USE_ROW.component.id,
      expect.objectContaining({ distance: 2900, lubricant: 'wax', cleaned: null }),
    );
  },
};

export const LogCareDialogMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async (context) => {
    await openCareDialog(context);
  },
};

/** The log care dialog in dark mode, for the a11y contrast check. */
export const LogCareDialogDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await openCareDialog(context);
  },
};

/** A top-up with the other lubricant warns that the chain should be cleaned first. */
export const LogCareDialogSwitchWarning: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async (context) => {
    const dialog = await openCareDialog(context);

    await context.userEvent.selectOptions(dialog.getByRole('combobox', { name: /^Lubricant/ }), 'Oil');
    await expect(dialog.getByRole('alert')).toHaveTextContent('Clean the chain before you switch');
    await expectNoOverflow(context.canvasElement);
  },
};

/** The warning in dark mode, for its contrast. */
export const LogCareDialogSwitchWarningDark: Story = {
  ...LogCareDialogSwitchWarning,
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await LogCareDialogSwitchWarning.play?.(context);
  },
};

/** A measurement without a stretch and a reading before the chain's installation, which asks for the distance. */
export const LogCareDialogErrors: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async (context) => {
    const dialog = await openCareDialog(context);
    const odometer = dialog.getByRole('textbox', { name: 'Odometer' });

    await context.userEvent.click(dialog.getByRole('radio', { name: 'Measured only' }));
    await context.userEvent.clear(odometer);
    await context.userEvent.type(odometer, '1000');
    await context.userEvent.click(dialog.getByRole('button', { name: 'Save' }));

    await expect(dialog.getByText(/^The chain went in use at 1,700.5 km\./)).toBeVisible();
    await expect(dialog.getByText('Enter the stretch you measured.')).toBeVisible();
    await expect(odometer).toHaveFocus();
    await expect(context.args.onLogCare).not.toHaveBeenCalled();
    await expectNoOverflow(context.canvasElement);
  },
};

/** The rejected log care dialog in dark mode, for the contrast of the error text. */
export const LogCareDialogErrorsDark: Story = {
  ...LogCareDialogErrors,
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await LogCareDialogErrors.play?.(context);
  },
};

/** A resting chain has no odometer field; its current distance is filled in. */
export const LogCareDialogRestingMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async (context) => {
    const dialog = await openNamedDialog(context, 'Log care: Chain Shimano CN-M8100 (B)', 'Log chain care');

    await expect(dialog.queryByRole('textbox', { name: 'Odometer' })).not.toBeInTheDocument();
    await expect(dialog.getByRole('textbox', { name: 'Chain distance' })).toHaveValue('1600');
    await expect(dialog.getByRole('combobox', { name: /^Lubricant/ })).toHaveValue('');
    await expectNoOverflow(context.canvasElement);
  },
};
