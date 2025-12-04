import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HistoryList from '@/components/HistoryList';
import { AuthContextProvider } from '@/context/AuthContext';
import { mockSupabaseAuth, resetSupabaseMocks, createMockSession } from '@/__tests__/utils/supabaseMock';
import axios from 'axios';

jest.mock('axios');
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

describe('HistoryList component', () => {
  const mockSession = createMockSession({ access_token: 'test-token' });

  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks(mockSession);

    const mockedAxios = jest.mocked(axios);
    mockedAxios.get.mockResolvedValue({ data: [] });
  });

  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContextProvider>
          <HistoryList />
        </AuthContextProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('is mounted to the DOM', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthContextProvider>
          <HistoryList />
        </AuthContextProvider>
      </MemoryRouter>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
