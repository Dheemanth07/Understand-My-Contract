import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '@/components/Header';

describe('Header component', () => {
  it('renders header with navigation', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText(/legalsimplify/i)).toBeInTheDocument();
  });

  it('renders link to home page', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: /legalsimplify/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders sign in navigation link', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/signin');
  });

  it('renders get started button', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    expect(getStartedButton).toBeInTheDocument();
  });

  it('renders logo image', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const logoImage = screen.getByAltText(/legalsimplify logo/i);
    expect(logoImage).toBeInTheDocument();
  });

  it('applies proper styling classes', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('absolute', 'top-0', 'left-0', 'w-full', 'z-50');
  });
});
