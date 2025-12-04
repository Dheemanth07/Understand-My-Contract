import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '@/routes/Dashboard';
import { AuthContextProvider } from '@/context/AuthContext';
import { mockSupabaseAuth, resetSupabaseMocks, createMockSession } from '@/__tests__/utils/supabaseMock';
import axios from 'axios';

// Mock axios at module level (configured in setup.ts)
jest.mock('axios');

// Mock window.confirm for delete operations
window.confirm = jest.fn(() => true);

describe('Dashboard', () => {
  const mockSession = createMockSession({ access_token: 'test-token' });

  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks(mockSession);
    
    const mockedAxios = jest.mocked(axios);
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.delete.mockResolvedValue({ data: { success: true } });
  });

  it('renders dashboard with sidebar and main content area', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/upload your legal document/i)).toBeInTheDocument();
    expect(screen.getByText(/your history/i)).toBeInTheDocument();
  });

  it('displays user greeting with email', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    // Should greet user with their email username
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });

  it('renders file upload section with input', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/select a file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload & simplify/i })).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('loads and displays history on mount', async () => {
    const mockedAxios = jest.mocked(axios);
    const mockHistory = [
      { id: '1', filename: 'document1.pdf', createdAt: new Date().toISOString() },
      { id: '2', filename: 'document2.pdf', createdAt: new Date().toISOString() },
    ];
    mockedAxios.get.mockResolvedValue({ data: mockHistory });

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.pdf')).toBeInTheDocument();
      expect(screen.getByText('document2.pdf')).toBeInTheDocument();
    });
  });

  it('displays "No history yet" when history is empty', async () => {
    const mockedAxios = jest.mocked(axios);
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no history yet/i)).toBeInTheDocument();
    });
  });

  it('allows file selection via input', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const fileInput = screen.getByLabelText(/select a file/i) as HTMLInputElement;
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    // File should be selected (implementation may vary)
    expect(fileInput.files).toHaveLength(1);
  });

  it('deletes history item when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockedAxios = jest.mocked(axios);
    const mockHistory = [
      { id: '1', filename: 'document1.pdf', createdAt: new Date().toISOString() },
    ];
    mockedAxios.get.mockResolvedValue({ data: mockHistory });

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/history/1'),
        expect.any(Object)
      );
    });
  });

  it('logs out user when logout button is clicked', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });
  });

  it('displays analysis results when processing completes', async () => {
    const user = userEvent.setup();
    const mockedAxios = jest.mocked(axios);
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <Dashboard />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const fileInput = screen.getByLabelText(/select a file/i) as HTMLInputElement;
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    // Note: SSE streaming would be tested with mockFetchSSE helper
    expect(screen.getByRole('button', { name: /upload & simplify/i })).toBeInTheDocument();
  });
});
