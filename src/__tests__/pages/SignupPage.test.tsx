import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from '@/pages/SignupPage';
import { AuthContextProvider } from '@/context/AuthContext';
import { mockSupabaseAuth, resetSupabaseMocks, createMockAuthError } from '@/__tests__/utils/supabaseMock';

// Mock the supabase client module
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

// Mock the GoogleSignInButton
jest.mock('@/components/GoogleSignInButton', () => {
  return function MockGoogleSignInButton({ children }: any) {
    return <button data-testid="mock-google-signup">{children}</button>;
  };
});

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks();
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: { id: 'new-user' }, session: null },
      error: null,
    });
  });

  it('renders signup form with name, email, and password fields', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your account/i })).toBeInTheDocument();
  });

  it('displays the sign-up heading and logo', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('renders link to signin page', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const signinLink = screen.getByRole('link', { name: /click here to sign in/i });
    expect(signinLink).toHaveAttribute('href', '/signin');
  });

  it('renders the Google sign-up button', () => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-google-signup')).toBeInTheDocument();
  });

  it('submits form with signup data', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    await waitFor(() => {
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'SecurePass123',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      });
    });
  });

  it('shows success toast after signup', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    await waitFor(() => {
      expect(screen.getByText(/signup successful/i)).toBeInTheDocument();
    });
  });

  it('shows error when account already exists', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: { id: 'existing-user' }, session: null },
      error: null,
    });

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    await waitFor(() => {
      expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
    });
  });

  it('displays error toast on signup failure', async () => {
    const user = userEvent.setup();
    const errorMsg = 'Email already in use';
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: null,
      error: createMockAuthError(errorMsg, { status: 400 }),
    });

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'duplicate@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  it('shows loading state while creating account', async () => {
    const user = userEvent.setup();
    mockSupabaseAuth.signUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: { id: 'test' }, session: null }, error: null }), 100))
    );

    render(
      <MemoryRouter>
        <AuthContextProvider>
          <SignupPage />
        </AuthContextProvider>
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /create your account/i });

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
