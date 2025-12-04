import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Footer />);
    expect(container).toBeTruthy();
  });

  it('is mounted to the DOM', () => {
    const { container } = render(<Footer />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
