import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { theme } from '@ui/theme';

import { CardList } from './CardList';
import type { CardListProps } from './types';

const ITEMS = [
  { id: 'one', title: 'First', media: <span data-testid="media-one" /> },
  { id: 'two', title: 'Second', media: <span data-testid="media-two" /> },
  { id: 'three', title: 'Third', media: <span data-testid="media-three" /> },
] as const;

type ItemId = (typeof ITEMS)[number]['id'];

/**
 * Renders the card list inside the app theme with sensible defaults.
 *
 * @param props - Prop overrides.
 * @returns The Testing Library render result.
 */
function renderList(props: Partial<CardListProps<ItemId>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <CardList<ItemId> aria-label="Things" items={ITEMS} onItemClick={vi.fn()} {...props} />
    </ThemeProvider>,
  );
}

describe('CardList', () => {
  it('renders a named list with one list item per entry, in order', () => {
    renderList();

    const list = screen.getByRole('list', { name: 'Things' });
    const cards = within(list).getAllByRole('listitem');

    expect(list.tagName).toBe('UL');
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.textContent)).toEqual(['First', 'Second', 'Third']);
  });

  it('wraps each card in a Paper list item', () => {
    renderList();

    for (const card of screen.getAllByRole('listitem')) {
      expect(card.tagName).toBe('LI');
      expect(card).toHaveClass('MuiPaper-root', 'MuiPaper-elevation1');
    }
  });

  it('removes the list bullets and spacing so the cards form a plain vertical stack', () => {
    renderList();

    const list = screen.getByRole('list');

    expect(list).toHaveStyle({ listStyle: 'none', margin: '0px', padding: '0px' });
    expect(list).toHaveStyle({ flexDirection: 'column' });
  });

  it('makes each card one native button that fills the Paper and is named by its title', () => {
    renderList();

    const cards = screen.getAllByRole('listitem');

    cards.forEach((card, index) => {
      const button = within(card).getByRole('button');

      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAccessibleName(ITEMS[index].title);
      expect(button.parentElement).toBe(card);
      expect(button).toHaveStyle({ width: '100%', textAlign: 'left' });
      // Only phrasing content inside the button.
      expect(button.querySelector('div')).toBeNull();
    });
  });

  it('reports the activated card by click, Enter, and Space', async () => {
    const onItemClick = vi.fn();
    renderList({ onItemClick });

    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    expect(onItemClick).toHaveBeenLastCalledWith('two');

    screen.getByRole('button', { name: 'Third' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onItemClick).toHaveBeenLastCalledWith('three');

    screen.getByRole('button', { name: 'First' }).focus();
    await userEvent.keyboard(' ');
    expect(onItemClick).toHaveBeenLastCalledWith('one');
    expect(onItemClick).toHaveBeenCalledTimes(3);
  });

  it('shows the media on the left, hidden from assistive tech', () => {
    renderList();

    const media = screen.getByTestId('media-two');
    const slot = media.parentElement as HTMLElement;

    expect(slot).toHaveAttribute('aria-hidden', 'true');
    expect(slot).toHaveStyle({ flexShrink: '0' });
    // The media slot comes before the text column in the card's flex row.
    expect(slot.nextElementSibling).toHaveTextContent('Second');
  });

  it('renders the title as a single truncating line above an empty second row that keeps its height', () => {
    renderList();

    const title = screen.getByText('First');
    const secondRow = title.nextElementSibling as HTMLElement;

    expect(title).toHaveClass('MuiTypography-subtitle1', 'MuiTypography-noWrap');
    expect(secondRow).toBeEmptyDOMElement();
    expect(secondRow).toHaveStyle({ minHeight: '24px' });
  });

  it('renders an empty list when there are no items', () => {
    renderList({ items: [] });

    expect(screen.getByRole('list')).toBeEmptyDOMElement();
  });
});
