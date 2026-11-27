import Button from '@mui/material/Button';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';

import { theme } from '@ui/theme';

import { ALL_TYPE_ROWS, CHAIN_IN_USE_ROW, CHAIN_RESTING_ROW, ROWS, TAPE_RESTING_ROW, toRow } from './__mocks__/rows';
import { ComponentList } from './ComponentList';
import type { ComponentListProps } from './types';
import { toRowId } from './utilities/toRowId';

/**
 * Renders a labelled list inside the app theme.
 *
 * @param props - The list's props.
 */
function renderList(props: Omit<ComponentListProps, 'aria-labelledby'>) {
  render(
    <ThemeProvider theme={theme}>
      <h3 id="heading">In use</h3>
      <ComponentList aria-labelledby="heading" {...props} />
    </ThemeProvider>,
  );
}

/**
 * Reads one row's labelled values.
 *
 * @param row - The row element.
 * @returns `term: value` per fact, top to bottom.
 */
function readFacts(row: HTMLElement): string[] {
  return within(row)
    .getAllByRole('term')
    .map((term) => `${term.textContent}: ${term.nextElementSibling?.textContent}`);
}

describe('ComponentList', () => {
  it('lists the translated type and the model of every row, in the given order', () => {
    renderList({ rows: ROWS });

    const rows = within(screen.getByRole('list', { name: 'In use' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringMatching(/^ChainShimano CN-M8100Label/),
      expect.stringMatching(/^WheelDT Swiss G 1800Distance/),
      expect.stringMatching(/^Bar tapeSupacaz Super Sticky KushLabel/),
      expect.stringMatching(/^ChainShimano CN-M8100Label/),
    ]);
  });

  it('shows the label and the distance, and the distance since installed only when in use', () => {
    renderList({ rows: [TAPE_RESTING_ROW, toRow(TAPE_RESTING_ROW.component, { isInUse: true, distanceSinceInstalled: 12 })] });

    const [resting, inUse] = screen.getAllByRole('listitem');
    expect(readFacts(resting)).toEqual(['Label: Red', 'Distance: 812.4 km']);
    expect(readFacts(inUse)).toEqual(['Label: Red', 'Distance: 0 km', 'Since installed: 12 km']);
  });

  it('shows the chain care values against their limits and says in text when one is reached', () => {
    renderList({ rows: [CHAIN_IN_USE_ROW] });

    expect(readFacts(screen.getByRole('listitem'))).toEqual([
      'Label: A',
      'Distance: 2,900 km',
      'Since installed: 1,400 km',
      'Lubricant: Wax',
      'Stretch: 0.3 of 0.5 %',
      'Since lubrication: 250 of 300 km',
      'Since cleaning: 1,550 of 1,500 km, limit reached',
    ]);
  });

  it('counts a value equal to its limit as reached, and shows a value without a limit on its own', () => {
    const { component } = CHAIN_IN_USE_ROW;
    renderList({
      rows: [
        toRow(
          { ...component, limits: { ...component.limits, lubrication: null } },
          { stretch: 0.5, distanceSinceLubrication: 900, distanceSinceCleaning: 0 },
        ),
      ],
    });

    expect(readFacts(screen.getByRole('listitem')).slice(-3)).toEqual([
      'Stretch: 0.5 of 0.5 %, limit reached',
      'Since lubrication: 900 km',
      'Since cleaning: 0 of 1,500 km',
    ]);
  });

  it('reads unknown chain care values as not specified', () => {
    renderList({ rows: [CHAIN_RESTING_ROW] });

    expect(readFacts(screen.getByRole('listitem'))).toEqual([
      'Label: B',
      'Distance: 1,600 km',
      'Lubricant: Not specified',
      'Stretch: Not specified',
      'Since lubrication: Not specified',
      'Since cleaning: Not specified',
    ]);
  });

  it('has a label for every component type and no chain care for other types', () => {
    renderList({ rows: ALL_TYPE_ROWS });

    expect(screen.getAllByRole('listitem')).toHaveLength(ALL_TYPE_ROWS.length);
    expect(screen.queryByText(/components\.types/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Lubricant')).toHaveLength(1);
  });

  it('puts a divider under every row but the last', () => {
    renderList({ rows: ROWS });

    expect(screen.getAllByRole('listitem').map((row) => row.classList.contains('MuiListItem-divider'))).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('renders the action of each row', () => {
    renderList({
      rows: ROWS,
      renderAction: ({ usage, component }) => (usage.isInUse ? null : <Button>Use {component.model}</Button>),
    });

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Use Supacaz Super Sticky Kush',
      'Use Shimano CN-M8100',
    ]);
  });

  it('lets rows take focus from a script only with an id prefix', () => {
    renderList({ rows: [CHAIN_IN_USE_ROW], rowIdPrefix: 'list' });

    const row = screen.getByRole('listitem');
    expect(row).toHaveAttribute('id', toRowId('list', CHAIN_IN_USE_ROW.component.id));
    expect(row).toHaveAttribute('tabindex', '-1');
  });

  it('leaves rows out of the focus order without an id prefix', () => {
    renderList({ rows: [CHAIN_IN_USE_ROW] });

    expect(screen.getByRole('listitem')).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('listitem')).not.toHaveAttribute('id');
  });
});
