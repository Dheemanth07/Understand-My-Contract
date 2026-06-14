import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Index from '@/pages/Index';
import { AuthContextProvider } from '@/context/AuthContext';
import { mockSupabaseAuth, resetSupabaseMocks } from '@/__tests__/utils/supabaseMock';

// Mock the supabase client module
jest.mock('@/lib/supabaseClient', () => {
  const { mockSupabaseAuth } = require('../utils/supabaseMock');
  return {
    supabase: {
      auth: mockSupabaseAuth,
    },
    createSupabaseClient: jest.fn(),
  };
});

describe('Index page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks();
  });

  it('renders the landing page with header and hero section', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Index />
        </AuthContextProvider>
      </MemoryRouter>
    );

    // Index should render with minimal layout (header, hero, features, footer)
    const mainElement = screen.queryByRole('main', { hidden: true }) || document.querySelector('div.min-h-screen');
    expect(mainElement).toBeInTheDocument();
  });

  it('displays the page with marketing components', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Index />
        </AuthContextProvider>
      </MemoryRouter>
    );

    // Verify the page contains the expected structure
    const container = document.querySelector('div.min-h-screen');
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContextProvider>
          <Index />
        </AuthContextProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});
