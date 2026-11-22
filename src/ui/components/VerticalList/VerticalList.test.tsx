import { ThemeProvider } from '@mui/material/styles';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { theme } from '@ui/theme';

import { VerticalList } from './VerticalList';
import type { VerticalListProps } from './types';

const ITEMS = [
  { id: 'one', label: 'First' },
  { id: 'two', label: 'Second' },
  { id: 'three', label: 'Third' },
] as const;

type ItemId = (typeof ITEMS)[number]['id'];

/**
 * Renders the list inside the app theme with sensible defaults.
 *
 * @param props - Prop overrides.
 * @returns The Testing Library render result.
 */
function renderList(props: Partial<VerticalListProps<ItemId>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <VerticalList<ItemId> items={ITEMS} onItemClick={vi.fn()} {...props} />
    </ThemeProvider>,
  );
}

describe('VerticalList', () => {
  it('renders one list item per entry, in order, each with a native button', () => {
    renderList();

    const rows = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.textContent)).toEqual(['First', 'Second', 'Third']);
    rows.forEach((row, index) => {
      const button = within(row).getByRole('button', { name: ITEMS[index].label });
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('calls onItemClick with the clicked item id', async () => {
    const onItemClick = vi.fn();
    renderList({ onItemClick });

    await userEvent.click(screen.getByRole('button', { name: 'Second' }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith('two');
  });

  it.each(['{Enter}', ' '])('activates the focused item with %j', async (key) => {
    const onItemClick = vi.fn();
    renderList({ onItemClick });

    act(() => screen.getByRole('button', { name: 'Third' }).focus());
    await userEvent.keyboard(key);

    expect(onItemClick).toHaveBeenCalledWith('three');
  });

  it('marks only the selected item as current', () => {
    renderList({ selectedId: 'two' });

    const selected = screen.getByRole('button', { name: 'Second' });

    expect(selected).toHaveAttribute('aria-current', 'page');
    expect(selected).toHaveClass('Mui-selected');
    for (const name of ['First', 'Third']) {
      expect(screen.getByRole('button', { name })).not.toHaveAttribute('aria-current');
      expect(screen.getByRole('button', { name })).not.toHaveClass('Mui-selected');
    }
  });

  it('marks nothing as current when selectedId matches no item', () => {
    renderList({ selectedId: 'home' });

    expect(screen.queryByRole('button', { current: 'page' })).not.toBeInTheDocument();
  });

  it('names the list and applies divided and dense styles when asked', () => {
    renderList({ 'aria-label': 'Choices', divided: true, dense: true });

    const list = screen.getByRole('list', { name: 'Choices' });

    expect(list).toHaveClass('MuiList-dense');
    within(list)
      .getAllByRole('listitem')
      .forEach((row) => expect(row).toHaveClass('MuiListItem-divider'));
  });

  it('renders no dividers by default', () => {
    renderList();

    screen.getAllByRole('listitem').forEach((row) => expect(row).not.toHaveClass('MuiListItem-divider'));
  });

  it('renders an empty list without items', () => {
    renderList({ items: [] });

    expect(screen.getByRole('list')).toBeEmptyDOMElement();
  });
});
