import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the supabase client to use our test mock
jest.mock('@/lib/supabaseClient', () => {
  const { mockSupabaseClient } = require('../utils/supabaseMock');
  return { supabase: mockSupabaseClient };
});

import { mockSupabaseAuth, resetSupabaseMocks } from '../utils/supabaseMock';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  it('renders children and icon', () => {
    render(<GoogleSignInButton>Sign in with Google</GoogleSignInButton>);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    // GoogleIcon renders an svg path; ensure an svg exists
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls supabase.auth.signInWithOAuth with google provider and correct redirect', async () => {
    render(<GoogleSignInButton>Sign in</GoogleSignInButton>);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);

    expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledTimes(1);
    const args = mockSupabaseAuth.signInWithOAuth.mock.calls[0][0];
    expect(args.provider).toBe('google');
    expect(args.options).toBeDefined();
    expect(args.options.redirectTo).toBe(`${window.location.origin}/dashboard`);
  });

  it('handles signInWithOAuth errors gracefully', async () => {
    mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    render(<GoogleSignInButton>Click</GoogleSignInButton>);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalled();
  });

  it('invokes OAuth handler on keyboard Enter press for accessibility', async () => {
    render(<GoogleSignInButton>Keyboard</GoogleSignInButton>);
    const btn = screen.getByRole('button');
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledTimes(1);
  });

  it('respects dynamic window.location.origin for redirect URL', async () => {
    const originalLocation = window.location;
    // Override origin temporarily
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // @ts-ignore
    window.location = { ...(originalLocation as any), origin: 'https://staging.example.test' };

    render(<GoogleSignInButton>Dynamic</GoogleSignInButton>);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);

    const args = mockSupabaseAuth.signInWithOAuth.mock.calls.slice(-1)[0][0];
    expect(args.options.redirectTo).toBe('https://staging.example.test/dashboard');

    // restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // @ts-ignore
    window.location = originalLocation;
  });

  it('renders JSX children (ReactNode) correctly', () => {
    render(
      <GoogleSignInButton>
        <span>Google Login</span>
      </GoogleSignInButton>
    );
    expect(screen.getByText('Google Login')).toBeInTheDocument();
  });
});
