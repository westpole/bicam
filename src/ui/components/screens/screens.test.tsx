import type { ComponentType } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { theme } from '@ui/theme';

import { AddClothesSet } from './AddClothesSet/AddClothesSet';
import { BeforeRideCheckIn } from './BeforeRideCheckIn/BeforeRideCheckIn';
import { SCREEN_COMPONENTS } from './constants';
import { ScreenPlaceholder } from './ScreenPlaceholder/ScreenPlaceholder';

/**
 * Renders a component inside the app theme.
 *
 * @param Component - The screen component to render.
 * @returns The Testing Library render result.
 */
function renderScreen(Component: ComponentType) {
  return render(
    <ThemeProvider theme={theme}>
      <Component />
    </ThemeProvider>,
  );
}

describe('placeholder screens', () => {
  it.each([
    ['AddClothesSet', AddClothesSet, 'Add clothes set'],
    ['BeforeRideCheckIn', BeforeRideCheckIn, 'Before ride check-in'],
  ] as const)('%s renders its translated title as an h2 with the coming-soon text', (_name, Component, title) => {
    renderScreen(Component);

    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveTextContent('This screen is coming soon.');
    // No extra landmark: the heading already names the screen.
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('maps every prop-less menu screen, and only those, to its component', () => {
    expect(SCREEN_COMPONENTS).toEqual({
      addClothesSet: AddClothesSet,
      beforeRideCheckIn: BeforeRideCheckIn,
    });
    expect(SCREEN_COMPONENTS).not.toHaveProperty('home');
    expect(SCREEN_COMPONENTS).not.toHaveProperty('addBicycle');
    expect(SCREEN_COMPONENTS).not.toHaveProperty('addComponent');
  });
});

describe('ScreenPlaceholder', () => {
  it('renders the title as an h5-styled h2 and the body in the secondary text color', () => {
    render(
      <ThemeProvider theme={theme}>
        <ScreenPlaceholder title="Custom title" />
      </ThemeProvider>,
    );

    const heading = screen.getByRole('heading', { level: 2, name: 'Custom title' });
    const body = screen.getByText('This screen is coming soon.');

    expect(heading).toHaveClass('MuiTypography-h5');
    expect(getComputedStyle(heading).overflowWrap).toBe('anywhere');
    expect(body).toHaveClass('MuiTypography-body1');
    expect(getComputedStyle(body).color).not.toBe(getComputedStyle(heading).color);
  });
});
