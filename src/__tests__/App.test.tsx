import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { INITIAL_APP_STATE } from '@store/constants';
import { useAppStore } from '@store/useAppStore';
import { BICYCLES, toBicycleCollection } from '@ui/components/screens/Home/__mocks__/bicycles';

import { App } from '../App';

describe('App', () => {
  beforeEach(() => {
    useAppStore.setState({ ...INITIAL_APP_STATE });
  });

  it('renders the project name as the page heading', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Bicam' })).toBeInTheDocument();
  });

  it('syncs the document title with the translated project name', () => {
    render(<App />);

    expect(document.title).toBe('Bicam');
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
  ] as const)('navigates to the %s placeholder', async (label, screenId) => {
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

  it("opens the clicked bicycle's details placeholder in place of the list", async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Roadie' }));

    expect(useAppStore.getState()).toMatchObject({ activeScreen: 'bicycleDetails', selectedBicycleId: BICYCLES[1].id });
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { level: 2, name: 'Roadie' })).toBeInTheDocument();
    expect(within(main).getByText('This screen is coming soon.')).toBeInTheDocument();
    expect(within(main).queryByRole('list', { name: 'Bicycles' })).not.toBeInTheDocument();
  });

  it('opens the details placeholder from the keyboard', async () => {
    useAppStore.setState({ bicycle: toBicycleCollection(BICYCLES) });
    render(<App />);

    screen.getByRole('button', { name: 'Commuter' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(within(screen.getByRole('main')).getByRole('heading', { level: 2, name: 'Commuter' })).toBeInTheDocument();
  });

  it('replaces the details placeholder with the chosen menu screen', async () => {
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
