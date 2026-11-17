import { render, screen } from '@testing-library/react';

import { App } from '../App';

describe('App', () => {
  it('renders the project name as the page heading', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Bicam' })).toBeInTheDocument();
  });

  it('syncs the document title with the translated project name', () => {
    render(<App />);

    expect(document.title).toBe('Bicam');
  });
});
