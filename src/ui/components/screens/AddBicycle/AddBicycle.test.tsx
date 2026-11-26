import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { BicycleResult, BicycleValidationError } from '@store/bicycle/types';
import { theme } from '@ui/theme';

import { BICYCLES } from '../Home/__mocks__/bicycles';
import { AddBicycle } from './AddBicycle';
import { INCOMPLETE_DATE } from '../utilities/constants';
import type { AddBicycleProps } from './types';

/**
 * Renders the form inside the app theme.
 *
 * @param result - What `onSubmit` returns.
 * @returns The handlers passed to the form.
 */
function renderForm(result: BicycleResult = { ok: true, bicycle: BICYCLES[0] }) {
  const onSubmit = vi.fn<AddBicycleProps['onSubmit']>(() => result);
  const onCancel = vi.fn<AddBicycleProps['onCancel']>();

  render(
    <ThemeProvider theme={theme}>
      <AddBicycle onSubmit={onSubmit} onCancel={onCancel} />
    </ThemeProvider>,
  );

  return { onSubmit, onCancel };
}

/**
 * Renders the form with a store that rejects every submit, and submits it.
 *
 * @param errors - The store's validation errors.
 * @returns The handlers passed to the form.
 */
async function submitRejected(errors: BicycleValidationError[]) {
  const handlers = renderForm({ ok: false, errors });

  await userEvent.click(screen.getByRole('button', { name: 'Save bicycle' }));

  return handlers;
}

describe('AddBicycle', () => {
  it('renders the title as an h2 and every field with a label and a hint', () => {
    renderForm();

    expect(screen.getByRole('heading', { level: 2, name: 'Add bicycle' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

    for (const name of ['Name', 'Company', 'Model']) {
      expect(screen.getByRole('textbox', { name })).toBeRequired();
    }
    for (const name of ['Frame size', 'Frame geometry']) {
      expect(screen.getByRole('textbox', { name })).not.toBeRequired();
    }
    expect(screen.getByLabelText('Purchase date')).toHaveAttribute('type', 'date');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription("Shown as the bicycle's title.");
    expect(screen.getByRole('textbox', { name: 'Frame geometry' })).toHaveProperty('tagName', 'TEXTAREA');
  });

  it('submits the values as typed', async () => {
    const { onSubmit } = renderForm();

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Gravel Grinder');
    await userEvent.type(screen.getByRole('textbox', { name: 'Company' }), 'Canyon');
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'Grizl');
    await userEvent.type(screen.getByLabelText('Purchase date'), '2024-05-17');
    await userEvent.type(screen.getByRole('textbox', { name: 'Frame size' }), 'M/L');
    await userEvent.type(screen.getByRole('textbox', { name: 'Frame geometry' }), 'Stack 594{Enter}Reach 393');
    await userEvent.click(screen.getByRole('button', { name: 'Save bicycle' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      name: 'Gravel Grinder',
      company: 'Canyon',
      model: 'Grizl',
      purchased: '2024-05-17',
      size: 'M/L',
      frameGeometry: 'Stack 594\nReach 393',
    });
  });

  it('submits with Enter from a single-line field', async () => {
    const { onSubmit } = renderForm();

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Roadie{Enter}');

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('marks every rejected field, describes the problem, and focuses the first one', async () => {
    await submitRejected([
      { field: 'company', code: 'required' },
      { field: 'size', code: 'invalidFormat' },
    ]);

    const company = screen.getByRole('textbox', { name: 'Company' });
    const size = screen.getByRole('textbox', { name: 'Frame size' });

    expect(company).toBeInvalid();
    expect(company).toHaveAccessibleDescription('This field is required.');
    expect(company).toHaveFocus();
    expect(size).toBeInvalid();
    expect(size).toHaveAccessibleDescription(/^Use only letters/);
    expect(screen.getByRole('textbox', { name: 'Model' })).toHaveAttribute('aria-invalid', 'false');
  });

  it.each([
    ['name', 'duplicate', 'Another bicycle already has this name.'],
    ['name', 'tooLong', 'Use 40 characters or fewer.'],
    ['company', 'tooLong', 'Use 60 characters or fewer.'],
    ['model', 'tooLong', 'Use 60 characters or fewer.'],
    ['model', 'invalidFormat', 'Remove the characters that are not allowed.'],
    ['purchased', 'invalidFormat', 'Enter a complete date with a four-digit year, or leave it empty.'],
    ['size', 'tooLong', 'Use 10 characters or fewer.'],
    ['frameGeometry', 'tooLong', 'Use 500 characters or fewer.'],
    ['name', 'tooMany', 'This value cannot be used.'],
    ['name', 'notFound', 'This value cannot be used.'],
    ['name', 'alreadyInstalled', 'This value cannot be used.'],
  ] as const)('explains a %s rejected as %s', async (field, code, message) => {
    await submitRejected([{ field, code }]);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("clears only the edited field's error and keeps the typed values", async () => {
    await submitRejected([
      { field: 'name', code: 'required' },
      { field: 'company', code: 'required' },
    ]);

    const name = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.type(name, 'Roadie');

    expect(name).toHaveValue('Roadie');
    expect(name).toHaveAttribute('aria-invalid', 'false');
    expect(name).toHaveAccessibleDescription("Shown as the bicycle's title.");
    expect(screen.getByRole('textbox', { name: 'Company' })).toBeInvalid();
  });

  it('shows a general alert when the only rejected field is not on the form', async () => {
    await submitRejected([{ field: 'components', code: 'notFound' }]);

    expect(screen.getByRole('alert')).toHaveTextContent('The bicycle could not be saved.');
    for (const textbox of screen.getAllByRole('textbox')) {
      expect(textbox).toHaveAttribute('aria-invalid', 'false');
    }
  });

  it('clears the general alert when a field is edited', async () => {
    await submitRejected([{ field: 'components', code: 'notFound' }]);

    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'G');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('remounts the general alert on a repeated rejection, so it is announced again', async () => {
    await submitRejected([{ field: 'components', code: 'notFound' }]);
    const first = screen.getByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: 'Save bicycle' }));

    expect(first).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('The bicycle could not be saved.');
  });

  it('does not show the general alert for two errors on one form field', async () => {
    await submitRejected([
      { field: 'name', code: 'tooLong' },
      { field: 'name', code: 'duplicate' },
    ]);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the general alert beside field errors, and drops it once only field errors are left', async () => {
    const { onSubmit } = await submitRejected([
      { field: 'name', code: 'required' },
      { field: 'components', code: 'notFound' },
    ]);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();

    onSubmit.mockReturnValue({ ok: false, errors: [{ field: 'name', code: 'required' }] });
    await userEvent.click(screen.getByRole('button', { name: 'Save bicycle' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInvalid();
  });

  it('does not submit a half-typed date as an empty one', async () => {
    const { onSubmit } = renderForm();
    // Test DOMs do not model a half-typed native date; browsers report it as an empty value with `badInput`.
    Object.defineProperty(screen.getByLabelText('Purchase date'), 'validity', { value: { badInput: true } });

    await userEvent.click(screen.getByRole('button', { name: 'Save bicycle' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ purchased: INCOMPLETE_DATE }));
  });

  it('cancels without submitting', async () => {
    const { onSubmit, onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
