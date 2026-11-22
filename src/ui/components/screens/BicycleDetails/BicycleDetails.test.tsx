import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { theme } from '@ui/theme';

import { BicycleDetails } from './BicycleDetails';

describe('BicycleDetails', () => {
  it("renders the bicycle's name as the screen heading with the coming-soon text", () => {
    render(
      <ThemeProvider theme={theme}>
        <BicycleDetails name="Gravel Grinder" />
      </ThemeProvider>,
    );

    const heading = screen.getByRole('heading', { level: 2, name: 'Gravel Grinder' });

    expect(heading).toBeInTheDocument();
    expect(heading.parentElement).toHaveTextContent('This screen is coming soon.');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
