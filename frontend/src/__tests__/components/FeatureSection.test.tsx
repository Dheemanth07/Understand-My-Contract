import { render, screen } from '@testing-library/react';
import FeatureSection from '@/components/FeatureSection';

describe('FeatureSection component', () => {
  it('renders without crashing', () => {
    const { container } = render(<FeatureSection />);
    expect(container).toBeTruthy();
  });

  it('is mounted to the DOM', () => {
    const { container } = render(<FeatureSection />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
