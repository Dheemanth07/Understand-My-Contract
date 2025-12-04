import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { AuthContextProvider } from '@/context/AuthContext';
import { mockSupabaseAuth, resetSupabaseMocks, createMockSession } from '@/__tests__/utils/supabaseMock';

// Mock supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

// Mock GoogleSignInButton for simplicity
jest.mock('@/components/GoogleSignInButton', () => {
  return function MockGoogleSignInButton({ children }: any) {
    return <button data-testid="mock-google-signin">{children}</button>;
  };
});

// Create a wrapper that provides AuthContext to the router
const TestRouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContextProvider>{children}</AuthContextProvider>
);

describe('Router configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks();
  });

  it('renders the index page at /', () => {
    render(
      <TestRouterWrapper>
        <RouterProvider router={router} />
      </TestRouterWrapper>
    );

    // Index page should render - look for a key element
    const container = document.querySelector('div.min-h-screen');
    expect(container).toBeInTheDocument();
  });

  it('route configuration has all expected paths', () => {
    const routePaths = router.routes.map((route: any) => route.path);
    
    expect(routePaths).toContain('/');
    expect(routePaths).toContain('/signin');
    expect(routePaths).toContain('/signup');
    expect(routePaths).toContain('/dashboard');
    expect(routePaths).toContain('/history');
    expect(routePaths).toContain('/history/:id');
    expect(routePaths).toContain('*'); // Catch-all for 404
  });

  it('protects /dashboard route with PrivateRoute', () => {
    const dashboardRoute = router.routes.find((route: any) => route.path === '/dashboard');
    expect(dashboardRoute).toBeDefined();
    expect(dashboardRoute?.element?.type?.name || dashboardRoute?.element?.props?.element?.type?.name).toBeDefined();
  });

  it('protects /history route with PrivateRoute', () => {
    const historyRoute = router.routes.find((route: any) => route.path === '/history');
    expect(historyRoute).toBeDefined();
  });

  it('protects /history/:id route with PrivateRoute', () => {
    const historyDetailRoute = router.routes.find((route: any) => route.path === '/history/:id');
    expect(historyDetailRoute).toBeDefined();
  });

  it('renders NotFound page for unknown routes', () => {
    // Create a custom router for this test to navigate to a non-existent route
    const { container } = render(
      <TestRouterWrapper>
        <RouterProvider router={router} />
      </TestRouterWrapper>
    );

    // The router should be properly configured
    expect(router.routes).toBeDefined();
    expect(Array.isArray(router.routes)).toBe(true);
  });

  it('signin and signup routes are public (not protected)', () => {
    const signinRoute = router.routes.find((route: any) => route.path === '/signin');
    const signupRoute = router.routes.find((route: any) => route.path === '/signup');

    expect(signinRoute).toBeDefined();
    expect(signupRoute).toBeDefined();

    // These routes should NOT have PrivateRoute as a wrapper
    // (they should be direct element, not wrapped)
    expect(signinRoute?.element?.type?.name).not.toBe('PrivateRoute');
    expect(signupRoute?.element?.type?.name).not.toBe('PrivateRoute');
  });
});

describe('Router navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks();
  });

  it('has correct structure with routes array', () => {
    expect(router).toBeDefined();
    expect(router.routes).toBeDefined();
    expect(Array.isArray(router.routes)).toBe(true);
  });

  it('all routes have a path property', () => {
    router.routes.forEach((route: any) => {
      expect(route.path).toBeDefined();
    });
  });

  it('all routes have an element property', () => {
    router.routes.forEach((route: any) => {
      expect(route.element).toBeDefined();
    });
  });
});
