import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { BicycleResult } from '@store/bicycle/types';
import { theme } from '@ui/theme';

import { BICYCLES } from '../Home/__mocks__/bicycles';
import { INCOMPLETE_DATE } from '../utilities/constants';
import { getToday } from '../utilities/getToday';
import type { UpdateDistanceDialogProps } from './types';
import { UpdateDistanceDialog } from './UpdateDistanceDialog';

/**
 * Renders the open dialog inside the app theme.
 *
 * @param result - What `onSetOdometer` returns.
 * @param odometer - The bicycle's current total.
 * @returns The handlers passed to the dialog.
 */
function renderDialog(result: BicycleResult = { ok: true, bicycle: BICYCLES[0] }, odometer = 1500.1) {
  const onSetOdometer = vi.fn<UpdateDistanceDialogProps['onSetOdometer']>(() => result);
  const onClose = vi.fn<UpdateDistanceDialogProps['onClose']>();

  render(
    <ThemeProvider theme={theme}>
      <UpdateDistanceDialog
        odometer={odometer}
        minimumOdometer={1200}
        onSetOdometer={onSetOdometer}
        onClose={onClose}
      />
    </ThemeProvider>,
  );

  return { onSetOdometer, onClose };
}

/** The distance field, whatever the mode calls it. */
const distanceField = () => screen.getByRole('textbox', { name: /distance/ });

/** The date field. */
const dateField = () => screen.getByLabelText('Date');

/** Clicks the save button. */
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('UpdateDistanceDialog', () => {
  it('opens set to a new total, with the distance focused and the date set to today', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Update distance' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Update by' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Set total' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Total distance' })).toHaveFocus();
    expect(distanceField()).toBeRequired();
    expect(distanceField()).toHaveAttribute('inputmode', 'decimal');
    expect(distanceField().parentElement).toHaveTextContent('km');
    expect(dateField()).toHaveValue(getToday());
    expect(dateField()).toHaveAttribute('max', '9999-12-31');
  });

  it('saves a new total with the date, then closes', async () => {
    const { onSetOdometer, onClose } = renderDialog();

    await userEvent.type(distanceField(), '1600.5');
    await save();

    expect(onSetOdometer).toHaveBeenCalledExactlyOnceWith({ odometer: 1600.5, date: getToday() });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('adds a ride to the current total, rounded to one decimal', async () => {
    const { onSetOdometer } = renderDialog();

    await userEvent.click(screen.getByRole('radio', { name: 'Add ride' }));
    expect(screen.getByRole('textbox', { name: 'Ride distance' })).toHaveAccessibleDescription(
      'Added to the current total of 1,500.1 km.',
    );
    await userEvent.type(distanceField(), '42.2');
    await save();

    expect(onSetOdometer).toHaveBeenCalledWith(expect.objectContaining({ odometer: 1542.3 }));
  });

  it('submits an unknown date when the date is cleared', async () => {
    const { onSetOdometer } = renderDialog();

    await userEvent.type(distanceField(), '1600');
    await userEvent.clear(dateField());
    await save();

    expect(onSetOdometer).toHaveBeenCalledWith({ odometer: 1600, date: '' });
  });

  it('does not submit a half-typed date as an empty one', async () => {
    const { onSetOdometer } = renderDialog();
    // Test DOMs do not model a half-typed native date; browsers report it as an empty value with `badInput`.
    Object.defineProperty(dateField(), 'validity', { value: { badInput: true } });

    await userEvent.type(distanceField(), '1600');
    await save();

    expect(onSetOdometer).toHaveBeenCalledWith(expect.objectContaining({ date: INCOMPLETE_DATE }));
  });

  it.each([
    ['total', '', 'Set total'],
    ['total', '1,5', 'Set total'],
    ['ride', '', 'Add ride'],
    ['ride', 'far', 'Add ride'],
  ])('submits NaN for a %s of %j, so the store rejects it', async (_mode, text, option) => {
    const { onSetOdometer } = renderDialog();
    await userEvent.click(screen.getByRole('radio', { name: option }));

    if (text !== '') {
      await userEvent.type(distanceField(), text);
    }
    await save();

    expect(onSetOdometer.mock.calls[0][0].odometer).toBeNaN();
  });

  it('names the lowest allowed reading for a total that is too low, and focuses the distance', async () => {
    const { onClose } = renderDialog({ ok: false, errors: [{ field: 'odometer', code: 'outOfRange' }] });
    await userEvent.click(dateField());

    await save();

    expect(distanceField()).toHaveAccessibleDescription('The total must be from 1,200 to 500,000 km.');
    expect(distanceField()).toHaveFocus();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('words a too-low total as a ride in ride mode', async () => {
    renderDialog({ ok: false, errors: [{ field: 'odometer', code: 'outOfRange' }] });
    await userEvent.click(screen.getByRole('radio', { name: 'Add ride' }));
    await userEvent.type(distanceField(), '-1000');

    await save();

    expect(distanceField()).toHaveAccessibleDescription(
      'The ride must bring the total to between 1,200 and 500,000 km.',
    );
  });

  it('explains a number that is not a number and a wrong date, and focuses the first', async () => {
    renderDialog({
      ok: false,
      errors: [
        { field: 'odometer', code: 'invalidFormat' },
        { field: 'odometerDate', code: 'invalidFormat' },
      ],
    });

    await save();

    expect(distanceField()).toHaveAccessibleDescription('Enter a number, for example 1500.');
    expect(dateField()).toHaveAccessibleDescription('Enter a complete date with a four-digit year, or leave it empty.');
    expect(distanceField()).toHaveFocus();
  });

  it('focuses the date when only the date is wrong', async () => {
    renderDialog({ ok: false, errors: [{ field: 'odometerDate', code: 'invalidFormat' }] });

    await save();

    expect(dateField()).toHaveFocus();
    expect(distanceField()).toHaveAttribute('aria-invalid', 'false');
  });

  it('clears an error when its field is edited, and the distance error when the mode changes', async () => {
    renderDialog({
      ok: false,
      errors: [
        { field: 'odometer', code: 'outOfRange' },
        { field: 'odometerDate', code: 'invalidFormat' },
      ],
    });
    await save();

    await userEvent.clear(dateField());
    expect(dateField()).toHaveAttribute('aria-invalid', 'false');
    expect(distanceField()).toHaveAttribute('aria-invalid', 'true');

    await userEvent.click(screen.getByRole('radio', { name: 'Add ride' }));
    expect(distanceField()).toHaveAttribute('aria-invalid', 'false');
  });

  it('clears the distance error when the distance is edited', async () => {
    renderDialog({ ok: false, errors: [{ field: 'odometer', code: 'outOfRange' }] });
    await save();

    await userEvent.type(distanceField(), '2');

    expect(distanceField()).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows an alert for an error that belongs to no field, and hides it on the next edit', async () => {
    renderDialog({ ok: false, errors: [{ field: 'id', code: 'notFound' }] });

    await save();
    expect(screen.getByRole('alert')).toHaveTextContent('The distance could not be saved.');

    await userEvent.type(distanceField(), '1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains any other store code on a field as a value that cannot be used', async () => {
    renderDialog({
      ok: false,
      errors: [
        { field: 'odometer', code: 'required' },
        { field: 'odometerDate', code: 'required' },
      ],
    });

    await save();

    expect(distanceField()).toHaveAccessibleDescription('This value cannot be used.');
    expect(dateField()).toHaveAccessibleDescription('This value cannot be used.');
  });

  it.each([
    ['Cancel', () => userEvent.click(screen.getByRole('button', { name: 'Cancel' }))],
    ['Escape', () => userEvent.keyboard('{Escape}')],
    // MUI closes the dialog on a click that lands on the container around the paper, which covers the backdrop.
    ['a click outside', () => userEvent.click(document.querySelector('.MuiDialog-container') as HTMLElement)],
  ])('closes without saving on %s', async (_name, close) => {
    const { onSetOdometer, onClose } = renderDialog();
    await userEvent.type(distanceField(), '1600');

    await close();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onSetOdometer).not.toHaveBeenCalled();
  });
});
