import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ComponentHistoryResult, ComponentUsagePeriod } from '@store/components/types';
import { CHAIN_IN_USE_ROW, CHAIN_RESTING_ROW } from '@ui/components/ComponentList/__mocks__/rows';
import { theme } from '@ui/theme';

import { INCOMPLETE_DATE } from '../utilities/constants';
import { getToday } from '../utilities/getToday';
import { acceptCare } from './__mocks__/careEntry';
import { LogCareDialog } from './LogCareDialog';
import type { LogCareDialogProps } from './types';

/**
 * Renders the open dialog inside the app theme.
 *
 * @param props - Props that differ from chain A in use (2900 km, in use since 3100, last lubricated with wax), an
 * odometer of 4500, and a store that accepts all.
 * @returns The handlers passed to the dialog.
 */
function renderDialog(props: Partial<LogCareDialogProps> = {}) {
  const onLogCare = vi.fn<LogCareDialogProps['onLogCare']>(acceptCare);
  const onClose = vi.fn<LogCareDialogProps['onClose']>();

  render(
    <ThemeProvider theme={theme}>
      <LogCareDialog row={CHAIN_IN_USE_ROW} odometer={4500} onLogCare={onLogCare} onClose={onClose} {...props} />
    </ThemeProvider>,
  );

  return { onLogCare, onClose };
}

/**
 * Builds a rejected entry.
 *
 * @param errors - The store's errors.
 * @returns The result.
 */
const reject = (...errors: Extract<ComponentHistoryResult, { ok: false }>['errors']): ComponentHistoryResult => ({
  ok: false,
  errors,
});

/** A field by its label. */
const field = (name: string) => screen.getByRole('textbox', { name });

/** The date field. */
const dateField = () => screen.getByLabelText(/^Date/);

/** The lubricant choice. */
const lubricantField = () => screen.getByRole('combobox', { name: /^Lubricant/ });

/**
 * Picks what was done.
 *
 * @param name - The option's label.
 */
const choose = (name: string) => userEvent.click(screen.getByRole('radio', { name }));

/**
 * Replaces a field's text.
 *
 * @param name - The field's label.
 * @param text - The new text.
 */
async function retype(name: string, text: string) {
  await userEvent.clear(field(name));

  if (text !== '') {
    await userEvent.type(field(name), text);
  }
}

/** Clicks the save button. */
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('LogCareDialog', () => {
  it('names the chain and opens on a top-up with the last lubricant, today, and the current odometer and distance', async () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Log chain care' })).toHaveAccessibleDescription(
      'Chain Shimano CN-M8100 (A), 2,900 km',
    );
    expect(screen.getByRole('radio', { name: 'Topped up' })).toBeChecked();
    // The focused radio starts its focus ripple after the render; waiting lets it settle inside `act`.
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Topped up' })).toHaveFocus());
    expect(lubricantField()).toHaveValue('wax');
    expect(within(lubricantField()).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Oil',
      'Wax',
    ]);
    expect(dateField()).toHaveValue(getToday());
    expect(field('Odometer')).toHaveValue('4500');
    expect(field('Odometer')).toHaveAttribute('inputmode', 'decimal');
    expect(field('Chain distance')).toHaveValue('2900');
    expect(field('Stretch')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('saves a top-up as lubricated with the lubricant, with the first usage start as installed, then closes', async () => {
    const usage: ComponentUsagePeriod[] = [
      {
        id: 'period-1',
        bicycleId: 'bike-1',
        start: { date: '2026-03-01', odometer: 3100 },
        end: null,
        replacedPeriodId: null,
      },
    ];
    const row = { ...CHAIN_IN_USE_ROW, component: { ...CHAIN_IN_USE_ROW.component, usage } };
    const { onLogCare, onClose } = renderDialog({ row });

    await save();

    expect(onLogCare).toHaveBeenCalledExactlyOnceWith({
      date: getToday(),
      installed: '2026-03-01',
      distance: 2900,
      stretch: null,
      lubricated: getToday(),
      lubricant: 'wax',
      cleaned: null,
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('saves a clean with the date as cleaned too, and an optional stretch', async () => {
    const { onLogCare } = renderDialog();

    await choose('Cleaned and relubricated');
    await userEvent.type(field('Stretch'), '0.25');
    await save();

    expect(onLogCare).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ lubricated: getToday(), cleaned: getToday(), lubricant: 'wax', stretch: 0.25 }),
    );
  });

  it('saves a measurement without a lubrication, and does not ask for the lubricant', async () => {
    const { onLogCare } = renderDialog();

    await choose('Measured only');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(field('Stretch')).toBeRequired();
    await userEvent.type(field('Stretch'), '0.4');
    await save();

    expect(onLogCare).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ stretch: 0.4, lubricated: null, lubricant: null, cleaned: null }),
    );
  });

  it('asks for the stretch of a measurement, and keeps the dialog open', async () => {
    const { onLogCare, onClose } = renderDialog();

    await choose('Measured only');
    await save();

    expect(field('Stretch')).toHaveAccessibleDescription('Enter the stretch you measured.');
    expect(field('Stretch')).toHaveFocus();
    expect(onLogCare).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('asks for oil or wax when no lubricant is known yet', async () => {
    const { onLogCare } = renderDialog({ row: CHAIN_RESTING_ROW });

    expect(lubricantField()).toHaveValue('');
    expect(within(lubricantField()).getAllByRole('option')[0]).toHaveTextContent('Choose oil or wax');
    await save();

    expect(lubricantField()).toHaveAccessibleDescription('Choose oil or wax.');
    expect(lubricantField()).toHaveFocus();
    expect(onLogCare).not.toHaveBeenCalled();

    await userEvent.selectOptions(lubricantField(), 'Oil');
    await save();
    expect(onLogCare).toHaveBeenCalledWith(expect.objectContaining({ lubricant: 'oil' }));
  });

  it('warns that the chain should be cleaned before a top-up with the other lubricant, and still saves it', async () => {
    const { onLogCare } = renderDialog();

    await userEvent.selectOptions(lubricantField(), 'Oil');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The last lubrication was with Wax. Clean the chain before you switch, so the two do not mix.',
    );

    await choose('Cleaned and relubricated');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await choose('Topped up');
    await save();
    expect(onLogCare).toHaveBeenCalledWith(expect.objectContaining({ lubricant: 'oil', cleaned: null }));
  });

  it('fills in the distance of a lower reading, for care entered late', async () => {
    const { onLogCare } = renderDialog();

    await retype('Odometer', '4000');
    expect(field('Chain distance')).toHaveValue('2400');

    await save();
    expect(onLogCare).toHaveBeenCalledWith(expect.objectContaining({ distance: 2400 }));
  });

  it('rejects a reading above the odometer', async () => {
    const { onLogCare } = renderDialog();

    await retype('Odometer', '4600');
    expect(field('Chain distance')).toHaveValue('2900');
    await save();

    expect(field('Odometer')).toHaveAccessibleDescription('The odometer can be at most 4,500 km.');
    expect(field('Odometer')).toHaveAttribute('aria-invalid', 'true');
    expect(field('Odometer')).toHaveFocus();
    expect(onLogCare).not.toHaveBeenCalled();
  });

  it('asks for the distance instead of a reading before the installation, which can then be left empty', async () => {
    const { onLogCare } = renderDialog();

    await retype('Odometer', '3000');
    await save();

    expect(field('Odometer')).toHaveAccessibleDescription(
      'The chain went in use at 3,100 km. Enter its distance at that time instead and leave the odometer empty.',
    );
    expect(onLogCare).not.toHaveBeenCalled();

    await retype('Odometer', '');
    await retype('Chain distance', '1450');
    await save();
    expect(onLogCare).toHaveBeenCalledWith(expect.objectContaining({ distance: 1450 }));
  });

  it('explains text that is not a number in the reading', async () => {
    renderDialog();

    await retype('Odometer', '4,000');
    await save();

    expect(field('Odometer')).toHaveAccessibleDescription(
      'Enter a number with at most 1 decimals, for example 1500.',
    );
  });

  it('has no odometer for a resting chain and fills in its current distance, which stays editable', async () => {
    const { onLogCare } = renderDialog({ row: CHAIN_RESTING_ROW });

    expect(screen.queryByRole('textbox', { name: 'Odometer' })).not.toBeInTheDocument();
    expect(field('Chain distance')).toHaveValue('1600');

    await userEvent.selectOptions(lubricantField(), 'Wax');
    await retype('Chain distance', '1500');
    await save();
    expect(onLogCare).toHaveBeenCalledWith(expect.objectContaining({ distance: 1500, installed: getToday() }));
  });

  it('saves an empty distance as unknown', async () => {
    const { onLogCare } = renderDialog();

    await retype('Chain distance', '');
    await save();

    expect(onLogCare).toHaveBeenCalledWith(expect.objectContaining({ distance: null }));
  });

  it("shows the store's errors on their fields, a broken date once, and focuses the first", async () => {
    const onLogCare = vi.fn(() =>
      reject(
        { field: 'date', code: 'invalidFormat' },
        { field: 'installed', code: 'invalidFormat' },
        { field: 'distance', code: 'outOfRange' },
        { field: 'lubricated', code: 'invalidFormat' },
        { field: 'stretch', code: 'invalidFormat' },
      ),
    );
    renderDialog({ onLogCare });

    await userEvent.type(field('Stretch'), '0.333');
    // Test DOMs do not model a half-typed native date; browsers report it as an empty value with `badInput`.
    Object.defineProperty(dateField(), 'validity', { value: { badInput: true } });
    await save();

    expect(onLogCare).toHaveBeenCalledWith(
      expect.objectContaining({ date: INCOMPLETE_DATE, installed: INCOMPLETE_DATE, lubricated: INCOMPLETE_DATE }),
    );
    expect(dateField()).toHaveAccessibleDescription('Enter a complete date with a four-digit year.');
    expect(dateField()).toHaveFocus();
    expect(field('Chain distance')).toHaveAccessibleDescription('The distance must be from 0 to 1,000,000 km.');
    expect(field('Stretch')).toHaveAccessibleDescription('Enter a number with at most 2 decimals, for example 0.3.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('asks for a date and names the stretch range', async () => {
    renderDialog({
      onLogCare: () => reject({ field: 'date', code: 'required' }, { field: 'stretch', code: 'outOfRange' }),
    });

    await save();

    expect(dateField()).toHaveAccessibleDescription('Enter the date of the care.');
    expect(field('Stretch')).toHaveAccessibleDescription('The stretch must be from 0 to 5 %.');
  });

  it('clears an error when its field is edited', async () => {
    renderDialog({ onLogCare: () => reject({ field: 'distance', code: 'invalidFormat' }) });

    await save();
    await userEvent.type(field('Chain distance'), '1');

    expect(field('Chain distance')).toHaveAccessibleDescription(
      "The chain's own distance at that time. Leave empty when unknown.",
    );
  });

  it('shows an alert for an error that belongs to no field, and hides it on the next edit', async () => {
    renderDialog({ onLogCare: () => reject({ field: 'history', code: 'tooMany' }) });

    await save();
    expect(screen.getByRole('alert')).toHaveTextContent('The care could not be saved.');

    await userEvent.type(field('Stretch'), '1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['Cancel', () => userEvent.click(screen.getByRole('button', { name: 'Cancel' }))],
    ['Escape', () => userEvent.keyboard('{Escape}')],
  ])('closes without saving on %s', async (_name, close) => {
    const { onLogCare, onClose } = renderDialog();

    await close();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onLogCare).not.toHaveBeenCalled();
  });
});
