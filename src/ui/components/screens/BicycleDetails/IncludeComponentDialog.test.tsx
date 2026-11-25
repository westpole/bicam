import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { BicycleResult } from '@store/bicycle/types';
import { COMPONENT_TYPES } from '@store/components/constants';
import type { BicycleComponent } from '@store/components/types';
import type { BicycleComponentResult, BicycleComponentValidationError } from '@store/types';
import { COMPONENTS, SPARE_COMPONENTS } from '@ui/components/ComponentList/__mocks__/components';
import { theme } from '@ui/theme';

import { BICYCLES } from '../Home/__mocks__/bicycles';
import { IncludeComponentDialog } from './IncludeComponentDialog';
import type { IncludeComponentDialogProps } from './types';

/** What the mocked store returns, and the spare components to offer. */
interface DialogSetup {
  spareComponents?: readonly BicycleComponent[];
  createResult?: BicycleComponentResult;
  includeResult?: BicycleResult;
}

/**
 * Renders the open dialog inside the app theme.
 *
 * @param setup - See {@link DialogSetup}; by default there are no spares and everything is accepted.
 * @returns The handlers passed to the dialog, and `rerenderWith`, which shows other spare components.
 */
function renderDialog({
  spareComponents = [],
  createResult = { ok: true, component: COMPONENTS[0] },
  includeResult = { ok: true, bicycle: BICYCLES[0] },
}: DialogSetup = {}) {
  const onCreateComponent = vi.fn<IncludeComponentDialogProps['onCreateComponent']>(() => createResult);
  const onIncludeComponent = vi.fn<IncludeComponentDialogProps['onIncludeComponent']>(() => includeResult);
  const onClose = vi.fn<IncludeComponentDialogProps['onClose']>();

  /**
   * Builds the dialog element.
   *
   * @param spares - The spare components to offer.
   * @returns The dialog inside the app theme.
   */
  const dialogWith = (spares: readonly BicycleComponent[]) => (
    <ThemeProvider theme={theme}>
      <IncludeComponentDialog
        spareComponents={spares}
        onCreateComponent={onCreateComponent}
        onIncludeComponent={onIncludeComponent}
        onClose={onClose}
      />
    </ThemeProvider>
  );

  const { rerender } = render(dialogWith(spareComponents));
  const rerenderWith = (spares: readonly BicycleComponent[]) => rerender(dialogWith(spares));

  return { onCreateComponent, onIncludeComponent, onClose, rerenderWith };
}

/**
 * Presses the dialog's "Include" button.
 */
async function submit() {
  await userEvent.click(screen.getByRole('button', { name: 'Include' }));
}

/**
 * Renders the dialog with a store that rejects every new component, and submits it.
 *
 * @param errors - The store's errors.
 * @returns The handlers passed to the dialog.
 */
async function submitRejected(errors: BicycleComponentValidationError[]) {
  const handlers = renderDialog({ createResult: { ok: false, errors } });

  await submit();

  return handlers;
}

describe('IncludeComponentDialog', () => {
  it('asks for the type and the model of a new component', () => {
    renderDialog();

    const type = screen.getByRole('combobox', { name: 'Type' });
    expect(type).toBeRequired();
    expect(type).toHaveDisplayValue('Choose a type');
    expect(within(type).getAllByRole('option')).toHaveLength(COMPONENT_TYPES.length + 1);
    expect(screen.getByRole('textbox', { name: 'Model' })).toBeRequired();
  });

  it('has no component choice when there are no spare components', () => {
    renderDialog();

    expect(screen.queryByRole('combobox', { name: 'Component' })).not.toBeInTheDocument();
  });

  it('submits a new component as typed and closes', async () => {
    const { onCreateComponent, onIncludeComponent, onClose } = renderDialog({ spareComponents: SPARE_COMPONENTS });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'Bar tape');
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), ' Supacaz ');
    await submit();

    expect(onCreateComponent).toHaveBeenCalledExactlyOnceWith({ type: 'barTape', model: ' Supacaz ' });
    expect(onIncludeComponent).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('includes the chosen spare component, without the new component fields, and closes', async () => {
    const { onCreateComponent, onIncludeComponent, onClose } = renderDialog({ spareComponents: SPARE_COMPONENTS });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Component' }), 'Saddle: Fizik Argo');
    expect(screen.queryByRole('combobox', { name: 'Type' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await submit();

    expect(onIncludeComponent).toHaveBeenCalledExactlyOnceWith(SPARE_COMPONENTS[1].id);
    expect(onCreateComponent).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('falls back to a new component when the chosen one is no longer spare', async () => {
    const { onCreateComponent, onIncludeComponent, rerenderWith } = renderDialog({ spareComponents: SPARE_COMPONENTS });
    const [chain, saddle] = SPARE_COMPONENTS;
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Component' }), saddle.id);

    rerenderWith([chain]);

    expect(screen.getByRole('combobox', { name: 'Component' })).toHaveDisplayValue('New component');
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'Argo');
    await submit();
    expect(onCreateComponent).toHaveBeenCalledExactlyOnceWith({ type: '', model: 'Argo' });
    expect(onIncludeComponent).not.toHaveBeenCalled();
  });

  it('drops the alert of a rejected spare component once a new one has field errors', async () => {
    const { rerenderWith } = renderDialog({
      spareComponents: SPARE_COMPONENTS,
      createResult: { ok: false, errors: [{ field: 'type', code: 'required' }] },
      includeResult: { ok: false, errors: [{ field: 'components', code: 'alreadyInstalled' }] },
    });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Component' }), SPARE_COMPONENTS[0].id);
    await submit();
    expect(screen.getByRole('alert')).toHaveTextContent('The component could not be included.');

    rerenderWith([]);
    await submit();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('This field is required.')).toBeInTheDocument();
  });

  it('shows every field error, focuses the first invalid field, and stays open', async () => {
    const { onClose } = await submitRejected([
      { field: 'type', code: 'required' },
      { field: 'model', code: 'tooLong' },
    ]);

    const type = screen.getByRole('combobox', { name: 'Type' });
    expect(type).toHaveFocus();
    expect(type).toBeInvalid();
    expect(type).toHaveAccessibleDescription('This field is required.');
    expect(screen.getByRole('textbox', { name: 'Model' })).toHaveAccessibleDescription('Use 60 characters or fewer.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    ['invalidFormat', 'Remove the characters that are not allowed.'],
    ['invalidOption', 'This value cannot be used.'],
  ] as const)('explains %s on a field and clears it on edit', async (code, message) => {
    await submitRejected([{ field: 'model', code }]);

    const model = screen.getByRole('textbox', { name: 'Model' });
    expect(model).toHaveFocus();
    expect(model).toHaveAccessibleDescription(message);

    await userEvent.type(model, 'x');
    expect(model).toBeValid();
    expect(model).toHaveAccessibleDescription('For example, Shimano CN-M8100.');
  });

  it.each([
    [{ field: 'components', code: 'tooMany' }, 'This bicycle already has the maximum of 100 components.'],
    [{ field: 'bicycleId', code: 'notFound' }, 'The component could not be included.'],
  ] as const)('shows an alert until the next edit when a new component is rejected with %j', async (error, message) => {
    const { onClose } = await submitRejected([error]);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(message);
    expect(onClose).not.toHaveBeenCalled();

    // A repeated rejection mounts a new alert, so it is announced again.
    await submit();
    expect(screen.getByRole('alert')).not.toBe(alert);

    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['tooMany', 'This bicycle already has the maximum of 100 components.'],
    ['notFound', 'The component could not be included.'],
    ['alreadyInstalled', 'The component could not be included.'],
  ] as const)('shows an alert until another choice when a spare component is rejected with %s', async (code, message) => {
    const { onClose } = renderDialog({
      spareComponents: SPARE_COMPONENTS,
      includeResult: { ok: false, errors: [{ field: 'components', code }] },
    });
    const choice = screen.getByRole('combobox', { name: 'Component' });

    await userEvent.selectOptions(choice, 'Chain: KMC X12');
    await submit();

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.selectOptions(choice, 'New component');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Model' })).toBeInTheDocument();
  });

  it.each([
    ['Cancel', () => userEvent.click(screen.getByRole('button', { name: 'Cancel' }))],
    ['Escape', () => userEvent.keyboard('{Escape}')],
  ])('closes without including anything on %s', async (_name, leave) => {
    const { onCreateComponent, onClose } = renderDialog();

    await leave();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onCreateComponent).not.toHaveBeenCalled();
  });
});
