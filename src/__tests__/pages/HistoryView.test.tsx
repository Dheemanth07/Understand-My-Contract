import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HistoryView from '@/pages/HistoryView';
import { AuthContextProvider } from '@/context/AuthContext';
import { mockSupabaseAuth, resetSupabaseMocks, createMockSession } from '@/__tests__/utils/supabaseMock';

// Mock fetch for the API call
global.fetch = jest.fn();

describe('HistoryView page', () => {
  const mockSession = createMockSession({ access_token: 'test-token' });
  const mockDocument = {
    id: '1',
    filename: 'contract.pdf',
    inputLang: 'en',
    outputLang: 'en',
    createdAt: new Date().toISOString(),
    sections: [
      {
        original: 'Original legal text here',
        summary: 'Simplified version here',
        legalTerms: [{ term: 'Liability', definition: 'Legal responsibility' }],
      },
    ],
    glossary: { 'Term': 'Definition' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks(mockSession);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockDocument,
    });
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => mockDocument }), 100))
    );

    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading document/i)).toBeInTheDocument();
  });

  it('displays document title and metadata', async () => {
    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('contract.pdf')).toBeInTheDocument();
      expect(screen.getByText(/uploaded by/i)).toBeInTheDocument();
    });
  });

  it('displays document sections with original and simplified text', async () => {
    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/original legal text here/i)).toBeInTheDocument();
      expect(screen.getByText(/simplified version here/i)).toBeInTheDocument();
    });
  });

  it('displays legal terms from sections', async () => {
    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Liability')).toBeInTheDocument();
      expect(screen.getByText('Legal responsibility')).toBeInTheDocument();
    });
  });

  it('displays glossary section with terms', async () => {
    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/glossary/i)).toBeInTheDocument();
      expect(screen.getByText('Term')).toBeInTheDocument();
      expect(screen.getByText('Definition')).toBeInTheDocument();
    });
  });

  it('renders back button', async () => {
    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  it('displays error message when document fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/document not found/i)).toBeInTheDocument();
    });
  });

  it('displays empty glossary message when no terms', async () => {
    const docWithoutGlossary = { ...mockDocument, glossary: {} };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => docWithoutGlossary,
    });

    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no glossary terms available/i)).toBeInTheDocument();
    });
  });

  it('formats created date correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/history/1']}>
        <AuthContextProvider>
          <HistoryView />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/created/i)).toBeInTheDocument();
    });
  });
});
