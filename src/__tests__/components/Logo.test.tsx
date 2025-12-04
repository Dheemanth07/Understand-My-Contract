import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Logo from '@/components/Logo';

describe('Logo component', () => {
  it('renders logo without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('is mounted to the DOM', () => {
    const { container } = render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
