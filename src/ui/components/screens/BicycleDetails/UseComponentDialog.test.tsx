import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ComponentUsageResult } from '@store/components/types';
import { CHAIN_IN_USE_ROW, CHAIN_RESTING_ROW, toRow } from '@ui/components/ComponentList/__mocks__/rows';
import { theme } from '@ui/theme';

import { INCOMPLETE_DATE } from '../utilities/constants';
import { getToday } from '../utilities/getToday';
import type { UseComponentDialogProps } from './types';
import { UseComponentDialog } from './UseComponentDialog';

/** A second chain in use, for a type with two candidates (the dialog does not check `ACTIVE_LIMITS`). */
const CHAIN_C_ROW = toRow(
  { ...CHAIN_RESTING_ROW.component, id: 'component-chain-c', label: 'C' },
  { isInUse: true, distance: 10 },
);

/**
 * Renders the open dialog inside the app theme, for resting chain B.
 *
 * @param props - Props that differ from a full type with chain A in use, at 4500 km, and a store that accepts all.
 * @returns The handlers passed to the dialog.
 */
function renderDialog(props: Partial<UseComponentDialogProps> = {}) {
  const onStart = vi.fn<UseComponentDialogProps['onStart']>(() => ({ ok: true, component: CHAIN_RESTING_ROW.component }));
  const getStartRange = vi.fn<UseComponentDialogProps['getStartRange']>(() => ({ min: 1500, max: 4500 }));
  const onClose = vi.fn<UseComponentDialogProps['onClose']>();

  render(
    <ThemeProvider theme={theme}>
      <UseComponentDialog
        row={CHAIN_RESTING_ROW}
        candidates={[CHAIN_IN_USE_ROW]}
        needsReplace
        odometer={4500}
        onStart={onStart}
        getStartRange={getStartRange}
        onClose={onClose}
        {...props}
      />
    </ThemeProvider>,
  );

  return { onStart, getStartRange, onClose };
}

/**
 * Builds a rejected start.
 *
 * @param errors - The store's errors.
 * @returns The result.
 */
const reject = (...errors: Extract<ComponentUsageResult, { ok: false }>['errors']): ComponentUsageResult => ({
  ok: false,
  errors,
});

/** The odometer field. */
const odometerField = () => screen.getByRole('textbox', { name: 'Odometer' });

/** The date field. */
const dateField = () => screen.getByLabelText('Date');

/** Clicks the save button. */
const save = () => userEvent.click(screen.getByRole('button', { name: 'Use now' }));

describe('UseComponentDialog', () => {
  it('names the component and opens with today, the current odometer, and the only candidate preselected', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Put component in use' });
    expect(dialog).toHaveAccessibleDescription('Chain Shimano CN-M8100 (B), 1,600 km');
    expect(dateField()).toHaveValue(getToday());
    expect(odometerField()).toHaveValue('4500');
    expect(odometerField()).toHaveFocus();
    expect(odometerField()).toHaveAttribute('inputmode', 'decimal');
    const replaces = screen.getByRole('combobox', { name: 'Replaces' });
    expect(within(replaces).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Shimano CN-M8100 (A), 2,900 km',
    ]);
    expect(replaces).toHaveValue(CHAIN_IN_USE_ROW.component.id);
  });

  it('starts with the defaults, replacing the preselected component, then closes', async () => {
    const { onStart, onClose } = renderDialog();

    await save();

    expect(onStart).toHaveBeenCalledExactlyOnceWith({
      date: getToday(),
      odometer: 4500,
      replaces: CHAIN_IN_USE_ROW.component.id,
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('asks which component to replace when several are in use, focusing the choice', async () => {
    const { onStart } = renderDialog({ candidates: [CHAIN_IN_USE_ROW, CHAIN_C_ROW] });

    const replaces = screen.getByRole('combobox', { name: 'Replaces' });
    expect(replaces).toHaveFocus();
    expect(replaces).toHaveValue('');
    expect(within(replaces).getAllByRole('option')[0]).toHaveTextContent('Choose a component');

    await userEvent.selectOptions(replaces, 'Shimano CN-M8100 (C), 10 km');
    await save();

    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ replaces: CHAIN_C_ROW.component.id }));
  });

  it('has no replace field when the type has room, and replaces nothing', async () => {
    const { onStart } = renderDialog({ needsReplace: false, candidates: [], odometer: 1500 });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    await userEvent.clear(odometerField());
    await userEvent.type(odometerField(), '0');
    await save();

    expect(onStart).toHaveBeenCalledExactlyOnceWith({ date: getToday(), odometer: 0, replaces: null });
  });

  it('enters a late swap at a lower reading and an unknown date', async () => {
    const { onStart } = renderDialog();

    await userEvent.clear(odometerField());
    await userEvent.type(odometerField(), '3100');
    await userEvent.clear(dateField());
    await save();

    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ odometer: 3100, date: '' }));
  });

  it('names the accepted readings for a rejected reading, for the chosen replacement, and focuses it', async () => {
    const { getStartRange, onClose } = renderDialog({ onStart: () => reject({ field: 'odometer', code: 'outOfRange' }) });

    await save();

    expect(getStartRange).toHaveBeenCalledExactlyOnceWith(CHAIN_IN_USE_ROW.component.id);
    expect(odometerField()).toHaveAccessibleDescription('The odometer must be from 1,500 to 4,500 km.');
    expect(odometerField()).toHaveAttribute('aria-invalid', 'true');
    expect(odometerField()).toHaveFocus();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('says the value cannot be used when no reading is accepted', async () => {
    renderDialog({ onStart: () => reject({ field: 'odometer', code: 'outOfRange' }), getStartRange: () => null });

    await save();

    expect(odometerField()).toHaveAccessibleDescription('This value cannot be used.');
  });

  it('explains a missing replacement, text that is not a number, and a half-typed date, focusing the first', async () => {
    const onStart = vi.fn(() =>
      reject(
        { field: 'replaces', code: 'required' },
        { field: 'odometer', code: 'invalidFormat' },
        { field: 'date', code: 'invalidFormat' },
      ),
    );
    renderDialog({ candidates: [CHAIN_IN_USE_ROW, CHAIN_C_ROW], onStart });

    await userEvent.clear(odometerField());
    await userEvent.type(odometerField(), '1,5');
    // Test DOMs do not model a half-typed native date; browsers report it as an empty value with `badInput`.
    Object.defineProperty(dateField(), 'validity', { value: { badInput: true } });
    await save();

    expect(onStart).toHaveBeenCalledExactlyOnceWith({ date: INCOMPLETE_DATE, odometer: NaN, replaces: null });
    const replaces = screen.getByRole('combobox', { name: 'Replaces' });
    expect(replaces).toHaveAccessibleDescription('Choose the component to replace.');
    expect(replaces).toHaveFocus();
    expect(odometerField()).toHaveAccessibleDescription('Enter a number, for example 1500.');
    expect(dateField()).toHaveAccessibleDescription(
      'Enter a complete date with a four-digit year, or leave it empty.',
    );
  });

  it('clears an error when its field is edited', async () => {
    renderDialog({ onStart: () => reject({ field: 'odometer', code: 'invalidFormat' }) });

    await save();
    await userEvent.type(odometerField(), '1');

    expect(odometerField()).toHaveAccessibleDescription(
      "The bicycle's total at the swap. Lower it for a swap entered late.",
    );
  });

  it('shows an alert for an error that belongs to no field, and hides it on the next edit', async () => {
    renderDialog({ onStart: () => reject({ field: 'usage', code: 'tooMany' }) });

    await save();
    expect(screen.getByRole('alert')).toHaveTextContent('The component could not be put in use.');

    await userEvent.type(odometerField(), '1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['Cancel', () => userEvent.click(screen.getByRole('button', { name: 'Cancel' }))],
    ['Escape', () => userEvent.keyboard('{Escape}')],
    // MUI closes the dialog on a click that lands on the container around the paper, which covers the backdrop.
    ['a click outside', () => userEvent.click(document.querySelector('.MuiDialog-container') as HTMLElement)],
  ])('closes without starting on %s', async (_name, close) => {
    const { onStart, onClose } = renderDialog();
    await userEvent.type(odometerField(), '0');

    await close();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });
});
