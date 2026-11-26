import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { COMPONENTS, SPARE_COMPONENTS } from '@ui/components/ComponentList/__mocks__/components';
import { theme } from '@ui/theme';

import { BICYCLES } from '../Home/__mocks__/bicycles';
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
    bicycle: BICYCLES[0],
  }));
  const onSetOdometer = vi.fn<BicycleDetailsProps['onSetOdometer']>(() => ({ ok: true, bicycle: BICYCLES[0] }));

  render(
    <ThemeProvider theme={theme}>
      <BicycleDetails
        bicycle={BICYCLES[0]}
        components={[]}
        spareComponents={[]}
        minimumOdometer={0}
        onSetOdometer={onSetOdometer}
        onCreateComponent={onCreateComponent}
        onIncludeComponent={onIncludeComponent}
        {...props}
      />
    </ThemeProvider>,
  );

  return { onCreateComponent, onIncludeComponent, onSetOdometer };
}

/**
 * Reads the shown details as label/value pairs.
 *
 * @returns The pairs, top to bottom.
 */
function readDetails(): Array<[string | null, string | null]> {
  return screen
    .getAllByRole('term')
    .map((term) => [term.textContent, term.nextElementSibling?.textContent ?? null]);
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

  it("lists the bicycle's components under their heading", () => {
    renderDetails({ components: COMPONENTS });

    expect(screen.getByRole('heading', { level: 3, name: 'Components' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Components' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(COMPONENTS.length);
    expect(screen.queryByText('No components on this bicycle yet.')).not.toBeInTheDocument();
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
    const { onCreateComponent } = renderDetails({ spareComponents: SPARE_COMPONENTS });

    await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'CN-M8100{Enter}');

    expect(onCreateComponent).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
    expect(screen.getByRole('textbox', { name: 'Model' })).toHaveValue('');
  });
});
