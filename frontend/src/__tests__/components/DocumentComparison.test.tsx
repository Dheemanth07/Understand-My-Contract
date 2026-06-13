import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocumentComparison from '@/components/DocumentComparison';

describe('DocumentComparison component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <DocumentComparison isDemo={true} />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('is mounted to the DOM', () => {
    const { container } = render(
      <MemoryRouter>
        <DocumentComparison isDemo={true} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
