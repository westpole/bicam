import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';

import { INITIAL_APP_STATE } from '@store/constants';
import { useAppStore } from '@store/useAppStore';
import { COMPONENTS, SPARE_COMPONENTS, toComponentCollection } from '@ui/components/ComponentList/__mocks__/components';
import { BICYCLES, toBicycleCollection } from '@ui/components/screens/Home/__mocks__/bicycles';
import { theme } from '@ui/theme';

import { App } from '../App';

describe('App', () => {
  beforeEach(() => {
    useAppStore.setState({ ...INITIAL_APP_STATE });
    // MUI saves the chosen color scheme mode to localStorage; start every test from `system`.
    localStorage.clear();
  });

  it('renders the project name as the page heading', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Bicam' })).toBeInTheDocument();
  });

  it('syncs the document title with the translated project name', () => {
    render(<App />);

    expect(document.title).toBe('Bicam');
  });

  it('switches between the light and dark color schemes from the header toggle', async () => {
    render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>,
    );
    const root = document.documentElement;

    // jsdom reports no `prefers-color-scheme: dark`, so the system mode resolves to light.
    await userEvent.click(await screen.findByRole('button', { name: 'Switch to dark theme' }));

    await waitFor(() => expect(root).toHaveClass('dark'));
    expect(screen.getByTestId('LightModeIcon')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));

    await waitFor(() => expect(root).toHaveClass('light'));
    expect(root).not.toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toContainElement(
      screen.getByTestId('DarkModeIcon'),
    );
  });

  it('starts with the menu closed and an empty main viewport', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
    expect(screen.getByRole('main')).not.toHaveAttribute('inert');
  });

  it('opens the menu from the header and closes it with the X button', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    const close = screen.getByRole('button', { name: 'Close menu' });
    expect(close).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('CloseIcon')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main menu' })).toBeInTheDocument();
    expect(document.querySelector('main')).toHaveAttribute('inert');
    expect(useAppStore.getState().isMenuOpen).toBe(true);

    await userEvent.click(close);

    expect(useAppStore.getState().isMenuOpen).toBe(false);
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(screen.getByRole('main')).not.toHaveAttribute('inert');
  });

  it('closes the menu with Escape and returns focus to the menu button', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add bicycle' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');

    expect(useAppStore.getState().isMenuOpen).toBe(false);
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus());
  });

  it('shows the chosen screen, closes the menu, and marks the option current on reopen', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add component' }));

    expect(useAppStore.getState()).toMatchObject({ isMenuOpen: false, activeScreen: 'addComponent' });
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { level: 2, name: 'Add component' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus());

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('button', { name: 'Add component' })).toHaveAttribute('aria-current', 'page');
  });

  it.each([
    ['Add bicycle', 'addBicycle'],
    ['Add clothes set', 'addClothesSet'],
    ['Before ride check-in', 'beforeRideCheckIn'],
  ] as const)('navigates to the %s screen', async (label, screenId) => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: label }));

    expect(useAppStore.getState().activeScreen).toBe(screenId);
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 2, name: label })).toBeInTheDocument();
  });

  it('lists the stored bicycles as cards on the home screen, in allIds order', () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);

    const list = within(screen.getByRole('main')).getByRole('list', { name: 'Bicycles' });

    const names = ['Gravel Grinder', 'Roadie', 'Commuter'];

    expect(within(list).getAllByRole('button')).toEqual(
      names.map((name) => within(list).getByRole('button', { name })),
    );
  });

  it('updates the list when bicycles are added, renamed, or removed through the store', () => {
    render(<App />);
    expect(screen.queryByRole('list', { name: 'Bicycles' })).not.toBeInTheDocument();

    let id = '';
    act(() => {
      const result = useAppStore.getState().addBicycle({ name: 'Roadie', company: 'Trek', model: 'Domane' });
      if (result.ok) id = result.bicycle.id;
    });
    expect(screen.getByRole('listitem')).toHaveTextContent('Roadie');

    act(() => {
      useAppStore.getState().updateBicycle(id, { name: 'Racer' });
    });
    expect(screen.getByRole('listitem')).toHaveTextContent('Racer');

    act(() => {
      useAppStore.getState().removeBicycle(id);
    });
    expect(screen.queryByRole('list', { name: 'Bicycles' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
  });

  it('replaces the bicycle list with the chosen menu screen', async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add bicycle' }));

    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { level: 2, name: 'Add bicycle' })).toBeInTheDocument();
    expect(within(main).queryByRole('list', { name: 'Bicycles' })).not.toBeInTheDocument();
  });

  it('saves a new bicycle from the form and shows it on the home screen', async () => {
    useAppStore.setState({ activeScreen: 'addBicycle', bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), ' Racer ');
    await userEvent.type(screen.getByRole('textbox', { name: 'Company' }), 'Trek');
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'Madone');
    await userEvent.click(screen.getByRole('button', { name: 'Save bicycle' }));

    const { activeScreen, bicycle } = useAppStore.getState();
    expect(activeScreen).toBe('home');
    expect(bicycle.allIds).toHaveLength(BICYCLES.length + 1);
    expect(bicycle.byId[bicycle.allIds[BICYCLES.length]]).toMatchObject({
      name: 'Racer',
      company: 'Trek',
      model: 'Madone',
      purchased: null,
      size: null,
      frameGeometry: null,
      components: [],
      odometer: 0,
      odometerDate: null,
    });
    const list = within(screen.getByRole('main')).getByRole('list', { name: 'Bicycles' });
    expect(within(list).getAllByRole('button')[BICYCLES.length]).toHaveAccessibleName('Racer');
  });

  it('stays on the form and explains the errors when the store rejects the bicycle', async () => {
    useAppStore.setState({ activeScreen: 'addBicycle', bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'roadie');
    await userEvent.click(screen.getByRole('button', { name: 'Save bicycle' }));

    expect(useAppStore.getState().activeScreen).toBe('addBicycle');
    expect(useAppStore.getState().bicycle.allIds).toHaveLength(BICYCLES.length);
    expect(screen.getByText('Another bicycle already has this name.')).toBeInTheDocument();
    expect(screen.getAllByText('This field is required.')).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it('returns home without adding anything when the form is cancelled', async () => {
    useAppStore.setState({ activeScreen: 'addBicycle' });
    render(<App />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Racer');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useAppStore.getState().activeScreen).toBe('home');
    expect(useAppStore.getState().bicycle.allIds).toEqual([]);
  });

  it('stores three labelled spare chains in a row from the "Add component" form, staying on it', async () => {
    useAppStore.setState({ activeScreen: 'addComponent' });
    render(<App />);

    for (const label of ['A', 'B', 'C']) {
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'chain');
      await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'KMC X12');
      await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), label);
      await userEvent.click(screen.getByRole('button', { name: 'Save component' }));

      expect(screen.getByRole('status')).toHaveTextContent(`Chain KMC X12 (${label}) was added.`);
    }

    const { activeScreen, bicycle, components } = useAppStore.getState();
    expect(activeScreen).toBe('addComponent');
    expect(bicycle.allIds).toEqual([]);
    expect(components.allIds.map((id) => components.byId[id])).toEqual(
      ['A', 'B', 'C'].map((label) =>
        expect.objectContaining({
          type: 'chain',
          model: 'KMC X12',
          label,
          initialDistance: 0,
          limits: { distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 },
          usage: [],
        }),
      ),
    );
  });

  it('puts a component from the form on a bicycle, in use, and opens that bicycle', async () => {
    const [gravel, roadie] = BICYCLES;
    useAppStore.setState({
      activeScreen: 'addComponent',
      bicycle: toBicycleCollection([gravel, { ...roadie, odometer: 2500 }]),
    });
    render(<App />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'chain');
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'KMC X12');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Bicycle' }), 'Roadie');
    expect(screen.getByRole('switch', { name: 'In use now' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Save component' }));

    const { activeScreen, selectedBicycleId, bicycle, components } = useAppStore.getState();
    const [id] = components.allIds;
    expect({ activeScreen, selectedBicycleId }).toEqual({
      activeScreen: 'bicycleDetails',
      selectedBicycleId: roadie.id,
    });
    expect(bicycle.byId[roadie.id].components).toEqual([id]);
    expect(components.byId[id].usage).toEqual([
      expect.objectContaining({ bicycleId: roadie.id, start: expect.objectContaining({ odometer: 2500 }), end: null }),
    ]);
    expect(screen.getByRole('heading', { level: 2, name: 'Roadie' })).toBeInTheDocument();
  });

  it('replaces the chain in use when the form adds a second one in use', async () => {
    const [gravel] = BICYCLES;
    useAppStore.setState({
      activeScreen: 'addComponent',
      bicycle: toBicycleCollection([{ ...gravel, odometer: 1500 }]),
    });
    render(<App />);

    for (const label of ['A', 'B']) {
      act(() => {
        // Chain A rides 300 km before B replaces it; a swap at the same reading would drop A's period (rule 7).
        if (label === 'B') {
          useAppStore.getState().setBicycleOdometer(gravel.id, { odometer: 1800, date: null });
        }

        useAppStore.setState({ activeScreen: 'addComponent', selectedBicycleId: null });
      });
      await screen.findByRole('heading', { level: 2, name: 'Add component' });
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'chain');
      await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'KMC X12');
      await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), label);
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Bicycle' }), 'Gravel Grinder');

      if (label === 'B') {
        expect(screen.getByRole('switch', { name: 'In use now' })).not.toBeChecked();
        await userEvent.click(screen.getByRole('switch', { name: 'In use now' }));
        expect(screen.getByRole('combobox', { name: /Replaces/ })).toHaveDisplayValue('KMC X12 (A)');
      }

      await userEvent.click(screen.getByRole('button', { name: 'Save component' }));
    }

    const { components } = useAppStore.getState();
    const [chainA, chainB] = components.allIds.map((id) => components.byId[id]);
    expect(chainA.usage).toEqual([
      expect.objectContaining({
        start: expect.objectContaining({ odometer: 1500 }),
        end: expect.objectContaining({ odometer: 1800 }),
      }),
    ]);
    expect(chainB.usage).toEqual([expect.objectContaining({ end: null, replacedPeriodId: chainA.usage[0].id })]);
  });

  it('keeps the "Add component" form open and explains the errors when the store rejects the component', async () => {
    useAppStore.setState({ activeScreen: 'addComponent' });
    render(<App />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Starting distance' }), '1,5');
    await userEvent.click(screen.getByRole('button', { name: 'Save component' }));

    expect(useAppStore.getState().components.allIds).toEqual([]);
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Starting distance' })).toHaveAccessibleDescription(
      'Enter a number, for example 412.5.',
    );
  });

  it('returns home without adding anything when the "Add component" form is cancelled', async () => {
    useAppStore.setState({ activeScreen: 'addComponent' });
    render(<App />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'KMC X12');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useAppStore.getState()).toMatchObject({ activeScreen: 'home', components: INITIAL_APP_STATE.components });
  });

  it("opens the clicked bicycle's details in place of the list", async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Roadie' }));

    expect(useAppStore.getState()).toMatchObject({ activeScreen: 'bicycleDetails', selectedBicycleId: BICYCLES[1].id });
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { level: 2, name: 'Roadie' })).toBeInTheDocument();
    expect(within(main).getByText('Grizl CF SL 7')).toBeInTheDocument();
    expect(within(main).getByText('No components on this bicycle yet.')).toBeInTheDocument();
    expect(within(main).queryByRole('list', { name: 'Bicycles' })).not.toBeInTheDocument();
  });

  it('sets the total and adds a ride from the details screen, showing the new distance', async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Roadie' }));
    const distance = screen.getByRole('region', { name: 'Distance' });

    await userEvent.click(within(distance).getByRole('button', { name: 'Update distance' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Total distance' }), '300');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(distance).getByText('300 km')).toBeInTheDocument();
    expect(useAppStore.getState().bicycle.byId[BICYCLES[1].id]).toMatchObject({ odometer: 300 });

    await userEvent.click(within(distance).getByRole('button', { name: 'Update distance' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Add ride' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Ride distance' }), '42.5');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(within(distance).getByText('342.5 km')).toBeInTheDocument();
    expect(useAppStore.getState().bicycle.byId[BICYCLES[0].id]).toMatchObject({ odometer: 0 });
  });

  it('keeps the distance dialog open and names the lowest reading when the total is below a usage boundary', async () => {
    const usage = [
      {
        id: 'p-1',
        bicycleId: BICYCLES[0].id,
        start: { date: null, odometer: 1500 },
        end: null,
        replacedPeriodId: null,
      },
    ];
    useAppStore.setState({
      bicycle: toBicycleCollection([{ ...BICYCLES[0], odometer: 2000, components: [COMPONENTS[0].id] }]),
      components: toComponentCollection([{ ...COMPONENTS[0], usage }]),
      activeScreen: 'bicycleDetails',
      selectedBicycleId: BICYCLES[0].id,
    });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Update distance' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Total distance' }), '1000');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('textbox', { name: 'Total distance' })).toHaveAccessibleDescription(
      'The total must be from 1,500 to 500,000 km.',
    );
    expect(useAppStore.getState().bicycle.byId[BICYCLES[0].id].odometer).toBe(2000);
  });

  it('creates a component from the details screen and lists it on that bicycle only', async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Roadie' }));

    await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'Chain');
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), ' CN-M8100 ');
    await userEvent.click(screen.getByRole('button', { name: 'Include' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'In use' });
    expect(within(list).getByRole('listitem')).toHaveTextContent(/^ChainCN-M8100Distance/);
    const { activeScreen, bicycle, components } = useAppStore.getState();
    expect(activeScreen).toBe('bicycleDetails');
    expect(components.allIds).toHaveLength(1);
    expect(bicycle.byId[BICYCLES[1].id].components).toEqual(components.allIds);
    expect(bicycle.byId[BICYCLES[0].id].components).toEqual([]);
  });

  it('includes a spare component after the installed ones, and offers none that another bicycle has', async () => {
    const [chain, wheel, tape] = COMPONENTS;
    const [gravel, roadie] = BICYCLES;
    useAppStore.setState({
      activeScreen: 'bicycleDetails',
      selectedBicycleId: gravel.id,
      bicycle: toBicycleCollection([
        { ...gravel, components: [chain.id, tape.id] },
        { ...roadie, components: [wheel.id] },
      ]),
      components: toComponentCollection([...COMPONENTS, ...SPARE_COMPONENTS]),
    });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
    const choice = screen.getByRole('combobox', { name: 'Component' });
    expect(
      within(choice)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['New component', 'Chain: KMC X12, 0 km', 'Saddle: Fizik Argo, 0 km']);
    await userEvent.selectOptions(choice, 'Saddle: Fizik Argo, 0 km');
    await userEvent.click(screen.getByRole('button', { name: 'Include' }));

    expect(useAppStore.getState().bicycle.byId[gravel.id].components).toEqual([
      chain.id,
      tape.id,
      SPARE_COMPONENTS[1].id,
    ]);
    const resting = within(screen.getByRole('list', { name: 'Resting' })).getAllByRole('listitem');
    expect(resting.map((row) => row.querySelector('p')?.textContent)).toEqual(['Chain', 'Bar tape']);
    // The saddle had room, so it started in use.
    const inUse = within(screen.getByRole('list', { name: 'In use' })).getAllByRole('listitem');
    expect(inUse.map((row) => row.querySelector('p')?.textContent)).toEqual(['Saddle']);
  });

  describe('using a resting component', () => {
    const [gravel] = BICYCLES;
    const chains = ['A', 'B', 'C'].map((label) => ({ ...COMPONENTS[0], id: `chain-${label}`, label }));
    const cassette = {
      ...COMPONENTS[0],
      id: 'cassette',
      type: 'cassette' as const,
      model: 'CS-M8100',
      limits: { distance: null, stretch: null, lubrication: null, cleaning: null },
      usage: [
        { id: 'period-cassette', bicycleId: gravel.id, start: { date: null, odometer: 0 }, end: null, replacedPeriodId: null },
      ],
    };

    /**
     * Shows the details of a bicycle with chains A, B, and C, none in use and none with usage periods (the state the
     * migration leaves for three chains), and a cassette in use since 0.
     *
     * @param odometer - The bicycle's odometer.
     */
    function showThreeChains(odometer: number) {
      useAppStore.setState({
        activeScreen: 'bicycleDetails',
        selectedBicycleId: gravel.id,
        bicycle: toBicycleCollection([
          { ...gravel, odometer, components: [...chains.map(({ id }) => id), cassette.id] },
        ]),
        components: toComponentCollection([...chains, cassette]),
      });
      render(<App />);
    }

    /**
     * Reads the distance of a row in a list.
     *
     * @param list - The list's name.
     * @param label - The component's label, or its model when it has none.
     * @returns The row's distance text.
     */
    function readDistance(list: string, label: string): string | null | undefined {
      const row = within(screen.getByRole('list', { name: list }))
        .getAllByRole('listitem')
        .find((item) => within(item).queryByText(label) !== null);

      return row && within(row).getByText('Distance').nextElementSibling?.textContent;
    }

    /**
     * Uses a component through its dialog.
     *
     * @param name - The accessible name of its **Use now** button.
     * @param odometer - The reading to type, or `undefined` to keep the current one.
     */
    async function startFromDialog(name: string, odometer?: string) {
      await userEvent.click(screen.getByRole('button', { name }));
      const dialog = screen.getByRole('dialog', { name: 'Put component in use' });

      if (odometer !== undefined) {
        const field = within(dialog).getByRole('textbox', { name: 'Odometer' });
        await userEvent.clear(field);
        await userEvent.type(field, odometer);
      }

      await userEvent.click(within(dialog).getByRole('button', { name: 'Use now' }));
    }

    it('credits the chosen chain with everything since 0 when none was in use', async () => {
      showThreeChains(1500);
      expect(screen.getByRole('alert')).toHaveTextContent('Chain: none in use.');

      await startFromDialog('Use now: Chain Shimano CN-M8100 (B)', '0');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(readDistance('In use', 'B')).toBe('1,500 km');
      expect(readDistance('Resting', 'A')).toBe('0 km');
      expect(readDistance('Resting', 'C')).toBe('0 km');
      expect(useAppStore.getState().components.byId['chain-B'].usage).toEqual([
        expect.objectContaining({ bicycleId: gravel.id, start: expect.objectContaining({ odometer: 0 }), end: null }),
      ]);
    });

    // Seven dialogs in a row take several seconds under load.
    it('swaps chains, splitting the distance at a late reading, as in the worked example', async () => {
      showThreeChains(0);
      await startFromDialog('Use now: Chain Shimano CN-M8100 (A)');

      const setTotal = async (total: string) => {
        await userEvent.click(screen.getByRole('button', { name: 'Update distance' }));
        await userEvent.type(screen.getByRole('textbox', { name: 'Total distance' }), total);
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      };

      await setTotal('1500');
      await startFromDialog('Use now: Chain Shimano CN-M8100 (B)');
      await setTotal('3100');
      await setTotal('4500');
      await startFromDialog('Use now: Chain Shimano CN-M8100 (A)', '3100');

      expect(readDistance('In use', 'A')).toBe('2,900 km');
      expect(readDistance('Resting', 'B')).toBe('1,600 km');
      expect(readDistance('Resting', 'C')).toBe('0 km');
      expect(readDistance('In use', 'CS-M8100')).toBe('4,500 km');
    }, 20_000);

    it('names the accepted readings when a swap reading is too early', async () => {
      showThreeChains(0);
      await startFromDialog('Use now: Chain Shimano CN-M8100 (A)');
      act(() => {
        useAppStore.getState().setBicycleOdometer(gravel.id, { odometer: 1500, date: null });
      });
      await startFromDialog('Use now: Chain Shimano CN-M8100 (B)');
      act(() => {
        useAppStore.getState().setBicycleOdometer(gravel.id, { odometer: 3100, date: null });
      });

      await startFromDialog('Use now: Chain Shimano CN-M8100 (A)', '1000');

      expect(screen.getByRole('textbox', { name: 'Odometer' })).toHaveAccessibleDescription(
        'The odometer must be from 1,500 to 3,100 km.',
      );
      await userEvent.keyboard('{Escape}');
      expect(readDistance('In use', 'B')).toBe('1,600 km');
    });

    it('logs the chain care of the worked example: a top-up restarts lubrication, a clean restarts both', async () => {
      showThreeChains(0);
      await startFromDialog('Use now: Chain Shimano CN-M8100 (A)');

      /**
       * Logs care on chain A at the current odometer.
       *
       * @param action - What was done.
       * @param lubricant - The lubricant to choose, or `undefined` to keep the preset one.
       */
      const logCare = async (action: string, lubricant?: string) => {
        await userEvent.click(screen.getByRole('button', { name: 'Log care: Chain Shimano CN-M8100 (A)' }));
        const dialog = within(screen.getByRole('dialog', { name: 'Log chain care' }));

        await userEvent.click(dialog.getByRole('radio', { name: action }));

        if (lubricant !== undefined) {
          await userEvent.selectOptions(dialog.getByRole('combobox', { name: /^Lubricant/ }), lubricant);
        }

        await userEvent.click(dialog.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      };
      const setOdometer = (odometer: number) =>
        act(() => {
          useAppStore.getState().setBicycleOdometer(gravel.id, { odometer, date: null });
        });
      const readCare = () => {
        const row = within(screen.getByRole('list', { name: 'In use' }))
          .getAllByRole('listitem')
          .find((item) => within(item).queryByText('A') !== null) as HTMLElement;
        const read = (term: string) => within(row).getByText(term).nextElementSibling?.textContent;

        return [read('Lubricant'), read('Since lubrication'), read('Since cleaning')];
      };

      await logCare('Cleaned and relubricated', 'Wax');
      setOdometer(300);
      expect(readCare()).toEqual(['Wax', '300 of 300 km, limit reached', '300 of 1,500 km']);

      await logCare('Topped up');
      setOdometer(550);
      expect(readCare()).toEqual(['Wax', '250 of 300 km', '550 of 1,500 km']);

      setOdometer(1500);
      await logCare('Cleaned and relubricated');
      expect(readCare()).toEqual(['Wax', '0 of 300 km', '0 of 1,500 km']);
      expect(useAppStore.getState().components.byId['chain-A'].history.map(({ distance }) => distance)).toEqual([
        0, 300, 1500,
      ]);
    }, 20_000);
  });

  describe('starting included components (rule 2)', () => {
    const [gravel] = BICYCLES;
    const [spareChain, spareSaddle] = SPARE_COMPONENTS;
    const chainInUse = {
      ...COMPONENTS[0],
      initialDistance: 100,
      usage: [
        { id: 'period-1', bicycleId: gravel.id, start: { date: null, odometer: 0 }, end: null, replacedPeriodId: null },
      ],
    };
    const startedAt800 = [expect.objectContaining({ start: expect.objectContaining({ odometer: 800 }), end: null })];

    beforeEach(() => {
      useAppStore.setState({
        activeScreen: 'bicycleDetails',
        selectedBicycleId: gravel.id,
        bicycle: toBicycleCollection([{ ...gravel, odometer: 800, components: [chainInUse.id] }]),
        components: toComponentCollection([chainInUse, spareChain, spareSaddle]),
      });
    });

    it('starts a spare whose type has room, and rests one whose type is full', async () => {
      render(<App />);

      for (const option of ['Chain: KMC X12, 0 km', 'Saddle: Fizik Argo, 0 km']) {
        await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
        await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Component' }), option);
        await userEvent.click(screen.getByRole('button', { name: 'Include' }));
      }

      const { bicycle, components } = useAppStore.getState();
      expect(bicycle.byId[gravel.id].components).toEqual([chainInUse.id, spareChain.id, spareSaddle.id]);
      expect(components.byId[spareChain.id].usage).toEqual([]);
      expect(components.byId[spareSaddle.id].usage).toEqual(startedAt800);
    });

    it('starts a new component whose type has room', async () => {
      render(<App />);

      await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'Cassette');
      await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), 'CS');
      await userEvent.click(screen.getByRole('button', { name: 'Include' }));

      const { bicycle, components } = useAppStore.getState();
      const cassetteId = components.allIds[3];
      expect(bicycle.byId[gravel.id].components).toEqual([chainInUse.id, cassetteId]);
      expect(components.byId[cassetteId].usage).toEqual(startedAt800);
    });
  });

  it('keeps the dialog open and explains the errors when the store rejects the component', async () => {
    useAppStore.setState({
      activeScreen: 'bicycleDetails',
      selectedBicycleId: BICYCLES[0].id,
      bicycle: toBicycleCollection(BICYCLES),
    });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
    await userEvent.click(screen.getByRole('button', { name: 'Include' }));

    expect(screen.getAllByText('This field is required.')).toHaveLength(2);
    expect(useAppStore.getState().components.allIds).toEqual([]);
  });

  it('opens the details screen from the keyboard', async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);

    screen.getByRole('button', { name: 'Commuter' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(within(screen.getByRole('main')).getByRole('heading', { level: 2, name: 'Commuter' })).toBeInTheDocument();
  });

  it('replaces the details screen with the chosen menu screen', async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Gravel Grinder' }));

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add component' }));

    expect(useAppStore.getState()).toMatchObject({ activeScreen: 'addComponent', selectedBicycleId: null });
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { level: 2, name: 'Add component' })).toBeInTheDocument();
    expect(within(main).queryByRole('heading', { level: 2, name: 'Gravel Grinder' })).not.toBeInTheDocument();
  });

  it('returns home from the details screen when the app title is clicked', async () => {
    useAppStore.setState({
      bicycle: toBicycleCollection(BICYCLES),
      activeScreen: 'bicycleDetails',
      selectedBicycleId: BICYCLES[0].id,
    });
    render(<App />);

    await userEvent.click(screen.getByRole('link', { name: 'Bicam' }));

    expect(useAppStore.getState()).toMatchObject({ activeScreen: 'home', selectedBicycleId: null });
    expect(within(screen.getByRole('main')).getByRole('list', { name: 'Bicycles' })).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  it('closes the open menu and goes home when the app title is clicked, keeping focus on the title', async () => {
    useAppStore.setState({ activeScreen: 'addComponent' });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('link', { name: 'Bicam' }));

    expect(useAppStore.getState()).toMatchObject({ isMenuOpen: false, activeScreen: 'home' });
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(screen.getByRole('main')).not.toHaveAttribute('inert');
    expect(screen.getByRole('link', { name: 'Bicam' })).toHaveFocus();
  });

  it('returns to the bicycle list when the shown bicycle is removed', () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    act(() => {
      useAppStore.getState().openBicycleDetails(BICYCLES[0].id);
    });
    render(<App />);
    expect(screen.getByRole('heading', { level: 2, name: 'Gravel Grinder' })).toBeInTheDocument();

    act(() => {
      useAppStore.getState().removeBicycle(BICYCLES[0].id);
    });

    const list = within(screen.getByRole('main')).getByRole('list', { name: 'Bicycles' });
    expect(within(list).getAllByRole('button')).toEqual(
      ['Roadie', 'Commuter'].map((name) => within(list).getByRole('button', { name })),
    );
  });

  it('renders nothing on the details screen if the selection points at no stored bicycle', () => {
    // Only reachable for one notification inside removeBicycle; set directly to cover the guard.
    useAppStore.setState({ activeScreen: 'bicycleDetails', selectedBicycleId: 'missing-id' });
    render(<App />);

    expect(screen.getByRole('main')).toBeEmptyDOMElement();
  });
});
