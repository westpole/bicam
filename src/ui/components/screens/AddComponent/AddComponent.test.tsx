import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { COMPONENT_TYPES } from '@store/components/constants';
import type { ComponentResult, ComponentValidationError } from '@store/components/types';
import { theme } from '@ui/theme';

import { COMPONENTS } from '../../ComponentList/__mocks__/components';
import { AddComponent } from './AddComponent';
import type { AddComponentProps } from './types';

const CHAIN = COMPONENTS[0];

/**
 * Renders the form inside the app theme.
 *
 * @param results - What `onSubmit` returns, one per call; the last one repeats.
 * @returns The handlers passed to the form.
 */
function renderForm(...results: ComponentResult[]) {
  const queue = results.length > 0 ? results : [{ ok: true, component: CHAIN } as const];
  let call = 0;
  const onSubmit = vi.fn<AddComponentProps['onSubmit']>(() => queue[Math.min(call++, queue.length - 1)]);
  const onCancel = vi.fn<AddComponentProps['onCancel']>();

  render(
    <ThemeProvider theme={theme}>
      <AddComponent onSubmit={onSubmit} onCancel={onCancel} />
    </ThemeProvider>,
  );

  return { onSubmit, onCancel };
}

/**
 * Finds a text field by its label.
 *
 * @param name - The field's label.
 * @returns The input.
 */
const field = (name: string) => screen.getByRole('textbox', { name });

/** The type select. */
const typeSelect = () => screen.getByRole('combobox', { name: 'Type' });

/** Clicks the save button. */
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save component' }));

describe('AddComponent', () => {
  it('renders the title as an h2, the details, and only the replacement limit before a type is chosen', () => {
    renderForm();

    expect(screen.getByRole('heading', { level: 2, name: 'Add component' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Limits' })).toBeInTheDocument();
    expect(typeSelect()).toBeRequired();
    expect(field('Model')).toBeRequired();
    for (const name of ['Label', 'Starting distance', 'Replace after']) {
      expect(field(name)).not.toBeRequired();
    }
    expect(screen.queryByRole('textbox', { name: 'Replace at stretch' })).not.toBeInTheDocument();
    expect(field('Label')).toHaveAccessibleDescription(
      'Optional. Tells identical parts apart, for example A or red link.',
    );
    expect(field('Starting distance')).toHaveAttribute('inputmode', 'decimal');
    expect(field('Starting distance').parentElement).toHaveTextContent('km');
  });

  it('offers every type after a "Choose a type" option', () => {
    renderForm();

    const options = within(typeSelect()).getAllByRole('option');
    expect(options[0]).toHaveTextContent('Choose a type');
    expect(options.slice(1).map((option) => option.getAttribute('value'))).toEqual([...COMPONENT_TYPES]);
  });

  it('fills the chain limits when a chain is chosen and shows the stretch hint', async () => {
    renderForm();

    await userEvent.selectOptions(typeSelect(), 'chain');

    expect(field('Replace after')).toHaveValue('');
    expect(field('Replace at stretch')).toHaveValue('0.5');
    expect(field('Top up lubricant every')).toHaveValue('300');
    expect(field('Clean and relubricate every')).toHaveValue('1500');
    expect(field('Replace at stretch')).toHaveAccessibleDescription(
      '0.5 % for 11–13-speed chains, 0.75 % for 5–10-speed chains.',
    );
    expect(field('Replace at stretch').parentElement).toHaveTextContent('%');
  });

  it('replaces only the limits the rider has not edited when the type changes', async () => {
    renderForm();
    await userEvent.selectOptions(typeSelect(), 'chain');
    await userEvent.clear(field('Top up lubricant every'));
    await userEvent.type(field('Top up lubricant every'), '250');
    await userEvent.type(field('Replace after'), '4000');

    await userEvent.selectOptions(typeSelect(), 'tire');
    expect(screen.queryByRole('textbox', { name: 'Top up lubricant every' })).not.toBeInTheDocument();
    expect(field('Replace after')).toHaveValue('4000');

    await userEvent.selectOptions(typeSelect(), 'chain');
    expect(field('Top up lubricant every')).toHaveValue('250');
    expect(field('Replace at stretch')).toHaveValue('0.5');
    expect(field('Replace after')).toHaveValue('4000');
  });

  it('submits a chain with every field, numbers parsed', async () => {
    const { onSubmit } = renderForm();
    await userEvent.selectOptions(typeSelect(), 'chain');
    await userEvent.type(field('Model'), 'KMC X12');
    await userEvent.type(field('Label'), 'A');
    await userEvent.type(field('Starting distance'), '412.5');
    await userEvent.clear(field('Clean and relubricate every'));

    await save();

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      type: 'chain',
      model: 'KMC X12',
      label: 'A',
      initialDistance: 412.5,
      limits: { distance: null, stretch: 0.5, lubrication: 300, cleaning: null },
    });
  });

  it('leaves out an empty starting distance and drops chain-only limits for other types, also edited ones', async () => {
    const { onSubmit } = renderForm();
    await userEvent.selectOptions(typeSelect(), 'chain');
    await userEvent.clear(field('Replace at stretch'));
    await userEvent.type(field('Replace at stretch'), 'oops');
    await userEvent.selectOptions(typeSelect(), 'saddle');
    await userEvent.type(field('Model'), 'Argo');

    await save();

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      type: 'saddle',
      model: 'Argo',
      label: '',
      limits: { distance: null },
    });
  });

  it.each([
    ['1,5', NaN],
    ['abc', NaN],
    ['1e3', NaN],
    [' 12 ', 12],
    ['-5', -5],
    ['.5', 0.5],
  ])('submits the starting distance %j as %s', async (text, expected) => {
    const { onSubmit } = renderForm();
    await userEvent.type(field('Starting distance'), text);

    await save();

    expect(onSubmit.mock.calls[0][0].initialDistance).toBe(expected);
  });

  it('clears the form after a save, focuses the type, and names the stored component', async () => {
    const labelled = { ...CHAIN, model: 'KMC X12', label: 'A' };
    renderForm({ ok: true, component: labelled }, { ok: true, component: CHAIN });
    await userEvent.selectOptions(typeSelect(), 'chain');
    await userEvent.type(field('Model'), 'KMC X12');
    await userEvent.type(field('Label'), 'A');

    await save();

    expect(screen.getByRole('status')).toHaveTextContent('Chain KMC X12 (A) was added.');
    expect(typeSelect()).toHaveValue('');
    expect(typeSelect()).toHaveFocus();
    expect(field('Model')).toHaveValue('');
    expect(field('Label')).toHaveValue('');
    expect(screen.queryByRole('textbox', { name: 'Replace at stretch' })).not.toBeInTheDocument();

    await save();
    expect(screen.getByRole('status')).toHaveTextContent('Chain Shimano CN-M8100 was added.');
  });

  it('forgets edited limits after a save, so the next chain gets the suggestions again', async () => {
    renderForm();
    await userEvent.selectOptions(typeSelect(), 'chain');
    await userEvent.clear(field('Replace at stretch'));
    await save();

    await userEvent.selectOptions(typeSelect(), 'chain');

    expect(field('Replace at stretch')).toHaveValue('0.5');
  });

  it('hides the saved message on the next edit', async () => {
    renderForm();
    await save();

    await userEvent.type(field('Model'), 'X');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows every error with its message, focuses the first invalid field, and clears an error on edit', async () => {
    const errors: ComponentValidationError[] = [
      { field: 'model', code: 'required' },
      { field: 'label', code: 'tooLong' },
      { field: 'initialDistance', code: 'invalidFormat' },
      { field: 'limits.distance', code: 'outOfRange' },
    ];
    renderForm({ ok: false, errors });

    await save();

    expect(field('Model')).toHaveAccessibleDescription('This field is required.');
    expect(field('Label')).toHaveAccessibleDescription('Use 20 characters or fewer.');
    expect(field('Starting distance')).toHaveAccessibleDescription('Enter a number, for example 412.5.');
    expect(field('Replace after')).toHaveAccessibleDescription('Enter a number above 0 and up to 500,000.');
    expect(field('Model')).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await userEvent.type(field('Model'), 'X');

    expect(field('Model')).toHaveAttribute('aria-invalid', 'false');
    expect(field('Label')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the chain limit errors on a chain', async () => {
    renderForm({ ok: false, errors: [{ field: 'limits.stretch', code: 'outOfRange' }] });
    await userEvent.selectOptions(typeSelect(), 'chain');

    await save();

    expect(field('Replace at stretch')).toHaveAccessibleDescription('Enter a number above 0 and up to 5.');
    expect(field('Replace at stretch')).toHaveFocus();
  });

  it('drops the errors of the limits that a type change resets, but keeps those of edited limits', async () => {
    renderForm({
      ok: false,
      errors: [
        { field: 'limits.stretch', code: 'outOfRange' },
        { field: 'limits.distance', code: 'outOfRange' },
      ],
    });
    await userEvent.selectOptions(typeSelect(), 'chain');
    await userEvent.type(field('Replace after'), '0');
    await save();

    await userEvent.selectOptions(typeSelect(), 'tire');
    await userEvent.selectOptions(typeSelect(), 'chain');

    expect(field('Replace at stretch')).toHaveValue('0.5');
    expect(field('Replace at stretch')).toHaveAttribute('aria-invalid', 'false');
    expect(field('Replace after')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an alert for an error on a field the form does not show, and hides it on the next edit', async () => {
    renderForm({ ok: false, errors: [{ field: 'limits.stretch', code: 'notAllowed' }] });

    await save();

    expect(screen.getByRole('alert')).toHaveTextContent('The component could not be saved.');

    await userEvent.type(field('Model'), 'X');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows field errors and the alert together when both kinds come back', async () => {
    renderForm({
      ok: false,
      errors: [
        { field: 'type', code: 'required' },
        { field: 'id', code: 'notFound' },
      ],
    });

    await save();

    expect(typeSelect()).toHaveFocus();
    expect(typeSelect()).toHaveAccessibleDescription('This field is required.');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onCancel without submitting', async () => {
    const { onSubmit, onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
