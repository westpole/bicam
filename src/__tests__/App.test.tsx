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

    expect(within(list).getAllByRole('button')).toEqual(names.map((name) => within(list).getByRole('button', { name })));
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

  it('creates a component from the details screen and lists it on that bicycle only', async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Roadie' }));

    await userEvent.click(screen.getByRole('button', { name: 'Include component' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'Chain');
    await userEvent.type(screen.getByRole('textbox', { name: 'Model' }), ' CN-M8100 ');
    await userEvent.click(screen.getByRole('button', { name: 'Include' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Components' });
    expect(within(list).getByRole('listitem')).toHaveTextContent('ChainCN-M8100');
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
    expect(within(choice).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'New component',
      'Chain: KMC X12',
      'Saddle: Fizik Argo',
    ]);
    await userEvent.selectOptions(choice, 'Saddle: Fizik Argo');
    await userEvent.click(screen.getByRole('button', { name: 'Include' }));

    expect(useAppStore.getState().bicycle.byId[gravel.id].components).toEqual([
      chain.id,
      tape.id,
      SPARE_COMPONENTS[1].id,
    ]);
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
      'ChainShimano CN-M8100',
      'Bar tapeSupacaz Super Sticky Kush',
      'SaddleFizik Argo',
    ]);
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
