import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';

import { theme } from '@ui/theme';

import { BICYCLES, LONG_NAME_BICYCLE } from './__mocks__/bicycles';
import { Home } from './Home';
import type { HomeProps } from './types';

/**
 * Renders the home screen inside the app theme.
 *
 * @param bicycles - The bicycles to show.
 * @returns The Testing Library render result.
 */
function renderHome(bicycles: HomeProps['bicycles']) {
  return render(
    <ThemeProvider theme={theme}>
      <Home bicycles={bicycles} />
    </ThemeProvider>,
  );
}

describe('Home', () => {
  it('lists every bicycle by name, in the given order, under the "Bicycles" label', () => {
    renderHome(BICYCLES);

    const list = screen.getByRole('list', { name: 'Bicycles' });
    const cards = within(list).getAllByRole('listitem');

    expect(cards.map((card) => card.textContent)).toEqual(['Gravel Grinder', 'Roadie', 'Commuter']);
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

  it('renders nothing when there are no bicycles', () => {
    const { container } = renderHome([]);

    expect(container).toBeEmptyDOMElement();
  });
});
