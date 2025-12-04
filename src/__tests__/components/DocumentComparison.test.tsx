import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocumentComparison from '@/components/DocumentComparison';

describe('DocumentComparison component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <DocumentComparison />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('is mounted to the DOM', () => {
    const { container } = render(
      <MemoryRouter>
        <DocumentComparison />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
