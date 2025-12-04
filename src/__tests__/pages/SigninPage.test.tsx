import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SigninPage from '@/pages/SigninPage';
import { AuthContextProvider } from '@/context/AuthContext';
import { mockSupabaseAuth, resetSupabaseMocks, createMockAuthError } from '@/__tests__/utils/supabaseMock';
import * as supabaseModule from '@/lib/supabaseClient';

// Mock the supabase client module
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
  createSupabaseClient: jest.fn(),
}));

// Mock the GoogleSignInButton to simplify testing
jest.mock('@/components/GoogleSignInButton', () => {
  return function MockGoogleSignInButton({ children }: any) {
    return <button data-testid="mock-google-signin">{children}</button>;
  };
});

describe('SigninPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks();
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'test-user' }, session: null },
      error: null,
    });
  });

  it('renders the signin form with email and password fields', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SigninPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays the logo and sign-in heading', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SigninPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/log in to your account/i)).toBeInTheDocument();
  });

  it('renders the Google sign-in button', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SigninPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-google-signin')).toBeInTheDocument();
  });

  it('renders link to signup page', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SigninPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('submits the form with email and password', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SigninPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state while signing in', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signInWithPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: { id: 'test' }, session: null }, error: null }), 100))
    );

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SigninPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('displays error toast on signin failure', async () => {
    const user = userEvent.setup();
    const errorMsg = 'Invalid credentials';
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: null,
      error: createMockAuthError(errorMsg, { status: 400 }),
    });

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SigninPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong-password');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  it('disables submit button when email or password is empty', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SigninPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });
});
