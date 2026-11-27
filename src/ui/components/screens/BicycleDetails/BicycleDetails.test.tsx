import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ComponentId } from '@store/components/types';
import { COMPONENTS, SPARE_COMPONENTS } from '@ui/components/ComponentList/__mocks__/components';
import {
  CHAIN_IN_USE_ROW,
  CHAIN_RESTING_ROW,
  ROWS,
  TAPE_RESTING_ROW,
  WHEEL_IN_USE_ROW,
} from '@ui/components/ComponentList/__mocks__/rows';
import type { ComponentRow } from '@ui/components/ComponentList/types';
import { theme } from '@ui/theme';

import { BICYCLES } from '../Home/__mocks__/bicycles';
import { SPARES } from './__mocks__/spareComponents';
import { BicycleDetails } from './BicycleDetails';
import type { BicycleDetailsProps } from './types';

/**
 * Renders the screen inside the app theme, with a store that accepts everything.
 *
 * @param props - Props that differ from a bicycle without components.
 * @returns The handlers passed to the screen.
 */
function renderDetails(props: Partial<BicycleDetailsProps> = {}) {
  const onCreateComponent = vi.fn<BicycleDetailsProps['onCreateComponent']>(() => ({
    ok: true,
    component: COMPONENTS[0],
  }));
  const onIncludeComponent = vi.fn<BicycleDetailsProps['onIncludeComponent']>(() => ({
    ok: true,
    component: SPARE_COMPONENTS[0],
  }));
  const onSetOdometer = vi.fn<BicycleDetailsProps['onSetOdometer']>(() => ({ ok: true, bicycle: BICYCLES[0] }));
  const onStartComponent = vi.fn<BicycleDetailsProps['onStartComponent']>((id) => ({
    ok: true,
    component: { ...COMPONENTS[0], id },
  }));
  const getStartRange = vi.fn<BicycleDetailsProps['getStartRange']>(() => ({ min: 0, max: 0 }));

  render(
    <ThemeProvider theme={theme}>
      <BicycleDetails
        bicycle={BICYCLES[0]}
        rows={[]}
        spareComponents={[]}
        minimumOdometer={0}
        onSetOdometer={onSetOdometer}
        onCreateComponent={onCreateComponent}
        onIncludeComponent={onIncludeComponent}
        onStartComponent={onStartComponent}
        getStartRange={getStartRange}
        {...props}
      />
    </ThemeProvider>,
  );

  return { onCreateComponent, onIncludeComponent, onSetOdometer, onStartComponent, getStartRange };
}

/**
 * Stands in for `App` and the store: a start puts the component in use, and a swap rests the replaced one.
 *
 * @param props - The component's props.
 * @param props.initialRows - The bicycle's rows before any start.
 * @returns The screen.
 */
function StatefulDetails({ initialRows }: { initialRows: readonly ComponentRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const start = (id: ComponentId, replaces: ComponentId | null | undefined) =>
    setRows((current) =>
      current.map((row) => {
        if (row.component.id === id) {
          return { ...row, usage: { ...row.usage, isInUse: true, distanceSinceInstalled: 0 } };
        }

        return row.component.id === replaces
          ? { ...row, usage: { ...row.usage, isInUse: false, distanceSinceInstalled: null } }
          : row;
      }),
    );

  return (
    <ThemeProvider theme={theme}>
      <BicycleDetails
        bicycle={{ ...BICYCLES[0], odometer: 4500 }}
        rows={rows}
        spareComponents={[]}
        minimumOdometer={0}
        onSetOdometer={() => ({ ok: true, bicycle: BICYCLES[0] })}
        onCreateComponent={() => ({ ok: true, component: COMPONENTS[0] })}
        onIncludeComponent={() => ({ ok: true, component: COMPONENTS[0] })}
        onStartComponent={(id, input) => {
          start(id, input.replaces);
          return { ok: true, component: COMPONENTS[0] };
        }}
        getStartRange={() => null}
      />
    </ThemeProvider>
  );
}

/**
 * Lists the rows of a list by their text.
 *
 * @param name - The list's accessible name.
 * @returns The type, model, and label of each row, as "Chain Shimano CN-M8100 (A)".
 */
function readList(name: string): string[] {
  return within(screen.getByRole('list', { name }))
    .getAllByRole('listitem')
    .map((row) => {
      const [type, model] = row.querySelectorAll('p');
      const label = within(row).queryByText('Label')?.nextElementSibling?.textContent;

      return `${type.textContent} ${model.textContent}${label ? ` (${label})` : ''}`;
    });
}

/**
 * Reads the shown details as label/value pairs.
 *
 * @returns The pairs, top to bottom.
 */
function readDetails(): Array<[string | null, string | null]> {
  return screen.getAllByRole('term').map((term) => [term.textContent, term.nextElementSibling?.textContent ?? null]);
}

describe('BicycleDetails', () => {
  it("renders the bicycle's name as the screen heading and every field", () => {
    renderDetails({
      bicycle: {
        ...BICYCLES[0],
        purchased: '2024-05-17',
        size: 'M/L',
        frameGeometry: 'Stack 594\nReach 393',
        odometer: 3100.5,
        odometerDate: '2026-04-12',
      },
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Gravel Grinder' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(readDetails()).toEqual([
      ['Company', 'Canyon'],
      ['Model', 'Grizl CF SL 7'],
      ['Purchase date', 'May 17, 2024'],
      ['Frame size', 'M/L'],
      ['Frame geometry', 'Stack 594\nReach 393'],
      ['Odometer', '3,100.5 km'],
      ['Reading date', 'Apr 12, 2026'],
    ]);
    expect(screen.getByRole('region', { name: 'Distance' })).toBeInTheDocument();
  });

  it('marks unknown fields as not specified', () => {
    renderDetails();

    expect(readDetails().slice(2)).toEqual([
      ['Purchase date', 'Not specified'],
      ['Frame size', 'Not specified'],
      ['Frame geometry', 'Not specified'],
      ['Odometer', '0 km'],
      ['Reading date', 'Not specified'],
    ]);
  });

  it('opens the distance dialog from its button and returns focus to it on cancel', async () => {
    const { onSetOdometer } = renderDetails();
    const update = screen.getByRole('button', { name: 'Update distance' });

    await userEvent.click(update);
    expect(screen.getByRole('dialog', { name: 'Update distance' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(update).toHaveFocus());
    expect(onSetOdometer).not.toHaveBeenCalled();
  });

  it('passes the current total and the lowest allowed reading to the distance dialog', async () => {
    const onSetOdometer = vi.fn<BicycleDetailsProps['onSetOdometer']>(() => ({
      ok: false,
      errors: [{ field: 'odometer', code: 'outOfRange' }],
    }));
    renderDetails({ bicycle: { ...BICYCLES[0], odometer: 1500 }, minimumOdometer: 900, onSetOdometer });

    await userEvent.click(screen.getByRole('button', { name: 'Update distance' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Add ride' }));

    expect(screen.getByRole('textbox', { name: 'Ride distance' })).toHaveAccessibleDescription(
      'Added to the current total of 1,500 km.',
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Ride distance' }), '-700');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('textbox', { name: 'Ride distance' })).toHaveAccessibleDescription(
      'The ride must bring the total to between 900 and 500,000 km.',
    );
    expect(onSetOdometer).toHaveBeenCalledWith(expect.objectContaining({ odometer: 800 }));
  });

  it("lists the bicycle's components in use and resting, in the bicycle's order, under the components heading", () => {
    renderDetails({ rows: [TAPE_RESTING_ROW, CHAIN_IN_USE_ROW, CHAIN_RESTING_ROW, WHEEL_IN_USE_ROW] });

    expect(screen.getByRole('heading', { level: 3, name: 'Components' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'In use' })).toBeInTheDocument();
    expect(readList('In use')).toEqual(['Chain Shimano CN-M8100 (A)', 'Wheel DT Swiss G 1800']);
    expect(readList('Resting')).toEqual(['Bar tape Supacaz Super Sticky Kush (Red)', 'Chain Shimano CN-M8100 (B)']);
    expect(screen.queryByText('No components on this bicycle yet.')).not.toBeInTheDocument();
  });

  it('shows the distances on each row, and since installed only in use', () => {
    renderDetails({ rows: ROWS });

    const [chain] = within(screen.getByRole('list', { name: 'In use' })).getAllByRole('listitem');
    expect(within(chain).getByText('2,900 km')).toBeInTheDocument();
    expect(within(chain).getByText('1,400 km')).toBeInTheDocument();
    expect(within(chain).getByText('1,550 of 1,500 km, limit reached')).toBeInTheDocument();
    const [tape] = within(screen.getByRole('list', { name: 'Resting' })).getAllByRole('listitem');
    expect(within(tape).queryByText('Since installed')).not.toBeInTheDocument();
  });

  it('hides an empty list', () => {
    renderDetails({ rows: [CHAIN_IN_USE_ROW] });

    expect(screen.getByRole('list', { name: 'In use' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Resting' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Resting' })).not.toBeInTheDocument();
  });

  it('offers Use now on resting rows only, naming the component', () => {
    renderDetails({ rows: ROWS });

    expect(screen.getAllByRole('button', { name: /^Use now/ }).map((button) => button.getAttribute('aria-label'))).toEqual([
      'Use now: Bar tape Supacaz Super Sticky Kush (Red)',
      'Use now: Chain Shimano CN-M8100 (B)',
    ]);
    expect(within(screen.getByRole('list', { name: 'In use' })).queryByRole('button')).not.toBeInTheDocument();
  });

  it('asks the rider to choose when a type has components but none in use', () => {
    renderDetails({ rows: [CHAIN_RESTING_ROW, WHEEL_IN_USE_ROW, TAPE_RESTING_ROW] });

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Chain: none in use. Choose one under Resting with Use now.',
      'Bar tape: none in use. Choose one under Resting with Use now.',
    ]);
  });

  it('shows no notice when every type has one in use', () => {
    renderDetails({ rows: [CHAIN_IN_USE_ROW, CHAIN_RESTING_ROW] });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens the use dialog with the component to replace preselected when its type is full', async () => {
    const { onStartComponent } = renderDetails({ bicycle: { ...BICYCLES[0], odometer: 4500 }, rows: ROWS });

    await userEvent.click(screen.getByRole('button', { name: 'Use now: Chain Shimano CN-M8100 (B)' }));
    const dialog = screen.getByRole('dialog', { name: 'Put component in use' });
    expect(within(dialog).getByRole('combobox', { name: 'Replaces' })).toHaveValue(CHAIN_IN_USE_ROW.component.id);
    expect(within(dialog).getByRole('textbox', { name: 'Odometer' })).toHaveValue('4500');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Use now' }));

    expect(onStartComponent).toHaveBeenCalledExactlyOnceWith(
      CHAIN_RESTING_ROW.component.id,
      expect.objectContaining({ odometer: 4500, replaces: CHAIN_IN_USE_ROW.component.id }),
    );
  });

  it('asks for no replacement when the type has room', async () => {
    renderDetails({ rows: ROWS });

    await userEvent.click(screen.getByRole('button', { name: 'Use now: Bar tape Supacaz Super Sticky Kush (Red)' }));

    expect(screen.getByRole('dialog', { name: 'Put component in use' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Replaces' })).not.toBeInTheDocument();
  });

  it('names the readings the store accepts for the component and the chosen replacement', async () => {
    const getStartRange = vi.fn<BicycleDetailsProps['getStartRange']>(() => ({ min: 1500, max: 4500 }));
    renderDetails({
      rows: ROWS,
      getStartRange,
      onStartComponent: () => ({ ok: false, errors: [{ field: 'odometer', code: 'outOfRange' }] }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Use now: Chain Shimano CN-M8100 (B)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Use now' }));

    expect(getStartRange).toHaveBeenCalledExactlyOnceWith(CHAIN_RESTING_ROW.component.id, CHAIN_IN_USE_ROW.component.id);
    expect(screen.getByRole('textbox', { name: 'Odometer' })).toHaveAccessibleDescription(
      'The odometer must be from 1,500 to 4,500 km.',
    );
  });

  it("moves focus to the component's row after a swap, and rests the replaced one", async () => {
    render(<StatefulDetails initialRows={ROWS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Use now: Chain Shimano CN-M8100 (B)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Use now' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readList('In use')).toEqual(['Wheel DT Swiss G 1800', 'Chain Shimano CN-M8100 (B)']);
    expect(readList('Resting')).toEqual(['Chain Shimano CN-M8100 (A)', 'Bar tape Supacaz Super Sticky Kush (Red)']);
    const [, started] = within(screen.getByRole('list', { name: 'In use' })).getAllByRole('listitem');
    await waitFor(() => expect(started).toHaveFocus());
  });

  it('returns focus to Use now when the use dialog is closed with Escape, without starting', async () => {
    const { onStartComponent } = renderDetails({ rows: ROWS });
    const useNow = screen.getByRole('button', { name: 'Use now: Chain Shimano CN-M8100 (B)' });

    await userEvent.click(useNow);
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(useNow).toHaveFocus());
    expect(onStartComponent).not.toHaveBeenCalled();
  });

  it('says so when the bicycle has no components', () => {
    renderDetails();

    expect(screen.getByText('No components on this bicycle yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('opens the dialog from the button and returns focus to it on cancel', async () => {
    const { onCreateComponent } = renderDetails();
    const include = screen.getByRole('button', { name: 'Include component' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(include);
    expect(screen.getByRole('dialog', { name: 'Include component' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(include).toHaveFocus());
    expect(onCreateComponent).not.toHaveBeenCalled();
  });

  it('closes the dialog after a component was included and starts the next one empty', async () => {
    const { onCreateComponent } = renderDetails({ spareComponents: SPARES });

    await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'CN-M8100{Enter}');

    expect(onCreateComponent).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
    expect(screen.getByRole('textbox', { name: 'Model' })).toHaveValue('');
  });
});
