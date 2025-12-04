import { render, screen } from '@testing-library/react';
import UploadSection from '@/components/UploadSection';
import { AuthContextProvider } from '@/context/AuthContext';
import { mockSupabaseAuth, resetSupabaseMocks, createMockSession } from '@/__tests__/utils/supabaseMock';
import { mockFetchSSE, createSSEChunk } from '@/__tests__/utils/apiMocks';

// Mock supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

describe('UploadSection component', () => {
  const mockOnProcessComplete = jest.fn();
  const mockSession = createMockSession({ access_token: 'test-token' });

  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks(mockSession);
  });

  it('renders upload section heading', () => {
    render(
      <AuthContextProvider>
        <UploadSection onProcessComplete={mockOnProcessComplete} />
      </AuthContextProvider>
    );

    expect(screen.getByText(/upload your legal document/i)).toBeInTheDocument();
  });

  it('renders drag and drop area', () => {
    render(
      <AuthContextProvider>
        <UploadSection onProcessComplete={mockOnProcessComplete} />
      </AuthContextProvider>
    );

    expect(screen.getByText(/drag & drop your pdf file/i)).toBeInTheDocument();
  });

  it('renders file input with correct accept attribute', () => {
    render(
      <AuthContextProvider>
        <UploadSection onProcessComplete={mockOnProcessComplete} />
      </AuthContextProvider>
    );

    const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('accept', '.pdf');
  });

  it('renders upload button', () => {
    render(
      <AuthContextProvider>
        <UploadSection onProcessComplete={mockOnProcessComplete} />
      </AuthContextProvider>
    );

    const uploadButton = screen.getByRole('button', { name: /process document/i });
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toBeDisabled(); // Should be disabled without file selection
  });

  it('displays security notice', () => {
    render(
      <AuthContextProvider>
        <UploadSection onProcessComplete={mockOnProcessComplete} />
      </AuthContextProvider>
    );

    expect(screen.getByText(/your documents are secure/i)).toBeInTheDocument();
    expect(screen.getByText(/documents are stored securely/i)).toBeInTheDocument();
  });

  it('renders info about supported file types', () => {
    render(
      <AuthContextProvider>
        <UploadSection onProcessComplete={mockOnProcessComplete} />
      </AuthContextProvider>
    );

    expect(screen.getByText(/supports pdf file up to 10mb/i)).toBeInTheDocument();
  });

  it('shows "Drag your file here" message on initial load', () => {
    render(
      <AuthContextProvider>
        <UploadSection onProcessComplete={mockOnProcessComplete} />
      </AuthContextProvider>
    );

    expect(screen.getByText(/drag & drop your pdf file/i)).toBeInTheDocument();
  });
});
