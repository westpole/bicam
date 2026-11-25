import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import type { BicycleComponent } from '@store/components/types';
import { theme } from '@ui/theme';

import { ALL_TYPE_COMPONENTS, COMPONENTS } from './__mocks__/components';
import { ComponentList } from './ComponentList';

/**
 * Renders a labelled list inside the app theme.
 *
 * @param components - The components to show.
 */
function renderList(components: readonly BicycleComponent[]) {
  render(
    <ThemeProvider theme={theme}>
      <h3 id="heading">Components</h3>
      <ComponentList aria-labelledby="heading" components={components} />
    </ThemeProvider>,
  );
}

describe('ComponentList', () => {
  it('lists the translated type and the model of every component, in the given order', () => {
    renderList(COMPONENTS);

    expect(screen.getByRole('list', { name: 'Components' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
      'ChainShimano CN-M8100',
      'WheelDT Swiss G 1800',
      'Bar tapeSupacaz Super Sticky Kush',
    ]);
  });

  it('has a label for every component type', () => {
    renderList(ALL_TYPE_COMPONENTS);

    expect(screen.getAllByRole('listitem')).toHaveLength(ALL_TYPE_COMPONENTS.length);
    expect(screen.queryByText(/components\.types/)).not.toBeInTheDocument();
  });

  it('puts a divider under every row but the last', () => {
    renderList(COMPONENTS);

    expect(screen.getAllByRole('listitem').map((row) => row.classList.contains('MuiListItem-divider'))).toEqual([
      true,
      true,
      false,
    ]);
  });
});
