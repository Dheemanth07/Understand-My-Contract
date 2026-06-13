import { render, screen } from '@testing-library/react';
import LegalHero from '@/components/LegalHero';

describe('LegalHero component', () => {
  it('renders without crashing', () => {
    const { container } = render(<LegalHero />);
    expect(container).toBeTruthy();
  });

  it('is mounted to the DOM', () => {
    const { container } = render(<LegalHero />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
