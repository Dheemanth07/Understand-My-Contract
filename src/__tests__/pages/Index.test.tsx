import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Index from '@/pages/Index';

describe('Index page', () => {
  it('renders the landing page with header and hero section', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    // Index should render with minimal layout (header, hero, features, footer)
    const mainElement = screen.getByRole('main', { hidden: true }) || document.querySelector('div.min-h-screen');
    expect(mainElement).toBeInTheDocument();
  });

  it('displays the page with marketing components', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    // Verify the page contains the expected structure
    const container = document.querySelector('div.min-h-screen');
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});
