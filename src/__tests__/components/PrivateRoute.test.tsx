import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the AuthContext hook
jest.mock('@/context/AuthContext', () => ({
  UserAuth: jest.fn(),
}));

// Mock the Spinner component used inside PrivateRoute to provide a stable test id
jest.mock('@/components/ui/Spinner', () => ({
  __esModule: true,
  default: () => <div data-testid="spinner-mock" />,
}));

import { UserAuth } from '@/context/AuthContext';
import PrivateRoute from '@/components/PrivateRoute';

describe('PrivateRoute', () => {
  const MockedUserAuth = UserAuth as jest.MockedFunction<any>;

  beforeEach(() => {
    MockedUserAuth.mockReset();
  });

  it('renders Spinner when loading is true', () => {
    MockedUserAuth.mockReturnValue({ session: null, loading: true });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Protected</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    // Spinner mocked to render a test id
    expect(screen.getByTestId('spinner-mock')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('redirects to /auth when unauthenticated', async () => {
    MockedUserAuth.mockReturnValue({ session: null, loading: false });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={<PrivateRoute><div>Protected Content</div></PrivateRoute>}
          />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Auth Page')).toBeInTheDocument());
  });

  it('renders children when authenticated', () => {
    const session = { user: { id: '1', email: 'a@b.com' } };
    MockedUserAuth.mockReturnValue({ session, loading: false });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Protected</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected')).toBeInTheDocument();
    expect(screen.queryByTestId('spinner-mock')).not.toBeInTheDocument();
  });
});
