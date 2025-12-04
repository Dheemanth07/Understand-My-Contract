import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '@/pages/NotFound';

describe('NotFound (404) page', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders 404 error heading', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays "Oops! Page not found" message', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText(/oops! page not found/i)).toBeInTheDocument();
  });

  it('renders home page link', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    const homeLink = screen.getByRole('link', { name: /return to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('logs error when component mounts', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <NotFound />
      </MemoryRouter>
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('404 Error'),
      expect.any(String)
    );

    consoleErrorSpy.mockRestore();
  });

  it('centers content vertically and horizontally', () => {
    const { container } = render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    const mainDiv = container.querySelector('div.min-h-screen');
    expect(mainDiv).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('applies proper styling classes', () => {
    const { container } = render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    const wrapper = container.querySelector('div.min-h-screen');
    expect(wrapper).toHaveClass('bg-gray-100');
  });
});
