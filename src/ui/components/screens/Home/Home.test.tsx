import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { theme } from '@ui/theme';

import { BICYCLES, LONG_NAME_BICYCLE } from './__mocks__/bicycles';
import { Home } from './Home';
import type { HomeProps } from './types';

/**
 * Renders the home screen inside the app theme.
 *
 * @param bicycles - The bicycles to show.
 * @param onBicycleClick - Card click handler.
 * @returns The Testing Library render result.
 */
function renderHome(bicycles: HomeProps['bicycles'], onBicycleClick: HomeProps['onBicycleClick'] = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <Home bicycles={bicycles} onBicycleClick={onBicycleClick} />
    </ThemeProvider>,
  );
}

describe('Home', () => {
  it('lists every bicycle by name, in the given order, under the "Bicycles" label', () => {
    renderHome(BICYCLES);

    const list = screen.getByRole('list', { name: 'Bicycles' });
    const names = ['Gravel Grinder', 'Roadie', 'Commuter'];

    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getAllByRole('button')).toEqual(names.map((name) => within(list).getByRole('button', { name })));
  });

  it('shows an "events placeholder" second row on each card, hidden from assistive tech', () => {
    renderHome(BICYCLES);

    const placeholders = screen.getAllByText('events placeholder');

    expect(placeholders).toHaveLength(3);
    for (const placeholder of placeholders) {
      expect(placeholder).toHaveAttribute('aria-hidden', 'true');
      expect(placeholder.parentElement?.previousElementSibling).toHaveClass('MuiTypography-subtitle1');
    }
  });

  it('shows the DirectionsBike icon in a rounded avatar on each card', () => {
    renderHome(BICYCLES);

    for (const card of screen.getAllByRole('listitem')) {
      const avatar = card.querySelector('.MuiAvatar-root');

      expect(avatar).toHaveClass('MuiAvatar-rounded');
      expect(within(card).getByTestId('DirectionsBikeIcon')).toBeInTheDocument();
    }
  });

  it('shows a long name in full in the DOM (truncation is visual only)', () => {
    renderHome([LONG_NAME_BICYCLE]);

    expect(screen.getByText(LONG_NAME_BICYCLE.name)).toBeInTheDocument();
  });

  it("reports the bicycle's id when its card is activated", async () => {
    const onBicycleClick = vi.fn();
    renderHome(BICYCLES, onBicycleClick);

    await userEvent.click(screen.getByRole('button', { name: 'Roadie' }));

    expect(onBicycleClick).toHaveBeenCalledWith(BICYCLES[1].id);
  });

  it('renders nothing when there are no bicycles', () => {
    const { container } = renderHome([]);

    expect(container).toBeEmptyDOMElement();
  });
});
