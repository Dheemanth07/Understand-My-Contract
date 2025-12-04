import React from 'react';
import { renderHook, act, waitFor, render } from '@testing-library/react';

// Ensure we use the test mock client
jest.mock('@/lib/supabaseClient', () => {
  const { mockSupabaseClient } = require('../utils/supabaseMock');
  return { supabase: mockSupabaseClient };
});

import {
  mockSupabaseClient,
  mockSupabaseAuth,
  resetSupabaseMocks,
  createMockSession,
  createMockAuthError,
  createMockAuthStateChangeCallback,
} from '../utils/supabaseMock';

import { AuthContextProvider, UserAuth } from '@/context/AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  it('initially sets loading=true and then becomes false after auth check', async () => {
    const wrapper = ({ children }: any) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const { result } = renderHook(() => UserAuth(), { wrapper });

    // loading should be true initially
    expect(result.current.loading).toBe(true);

    // Simulate auth state change to signed out
    act(() => {
      createMockAuthStateChangeCallback('SIGNED_OUT', null);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  it('signIn updates session on success', async () => {
    const wrapper = ({ children }: any) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const session = createMockSession();
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: { session }, error: null });

    const { result } = renderHook(() => UserAuth(), { wrapper });

    // call signIn
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    // after successful signIn, set session via onAuthStateChange callback
    act(() => {
      createMockAuthStateChangeCallback('SIGNED_IN', session);
    });

    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(result.current.session.user.email).toBe('test@example.com');
    // Ensure signIn used signInWithPassword and not legacy signIn
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(mockSupabaseAuth.signInWithPassword.mock.calls[0][0]).toEqual({ email: 'test@example.com', password: 'password' });
    expect(mockSupabaseAuth.signIn).not.toHaveBeenCalled();
  });

  it('signOut clears session', async () => {
    const wrapper = ({ children }: any) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const session = createMockSession();
    // Pre-populate by simulating sign in
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: { session }, error: null });

    const { result, unmount } = renderHook(() => UserAuth(), { wrapper });

    // simulate sign in and auth state change
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });
    act(() => createMockAuthStateChangeCallback('SIGNED_IN', session));

    await waitFor(() => expect(result.current.session).not.toBeNull());

    // Now sign out
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });
    await act(async () => {
      await result.current.signOut();
    });

    // simulate auth state change to signed out
    act(() => createMockAuthStateChangeCallback('SIGNED_OUT', null));

    await waitFor(() => expect(result.current.session).toBeNull());

    // cleanup subscription should unsubscribe on unmount
    const call = mockSupabaseAuth.onAuthStateChange.mock.results[0];
    const sub = call?.value?.data?.subscription;
    unmount();
    if (sub) expect(sub.unsubscribe).toHaveBeenCalled();
  });

  it('handles signIn errors gracefully', async () => {
    const wrapper = ({ children }: any) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const error = createMockAuthError('Invalid credentials');
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: null, error });

    const { result } = renderHook(() => UserAuth(), { wrapper });

    await act(async () => {
      const resp = await result.current.signIn('noone@example.com', 'badpw');
      expect(resp.error).toBeDefined();
    });
  });

  it('signUp calls supabase.auth.signUp and returns response on success', async () => {
    const wrapper = ({ children }: any) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const signUpResponse = { data: { user: { id: 'u1', email: 'new@example.com' } }, error: null };
    mockSupabaseAuth.signUp.mockResolvedValueOnce(signUpResponse);

    const { result } = renderHook(() => UserAuth(), { wrapper });

    let resp: any;
    await act(async () => {
      resp = await result.current.signUp('new@example.com', 'pw');
    });

    expect(mockSupabaseAuth.signUp).toHaveBeenCalledTimes(1);
    expect(mockSupabaseAuth.signUp.mock.calls[0][0]).toEqual({ email: 'new@example.com', password: 'pw' });
    expect(resp).toEqual(signUpResponse);
  });

  it('signUp surfaces errors when signUp fails', async () => {
    const wrapper = ({ children }: any) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const error = createMockAuthError('Email exists', { status: 400, name: 'BadRequest' });
    mockSupabaseAuth.signUp.mockResolvedValueOnce({ data: null, error });

    const { result } = renderHook(() => UserAuth(), { wrapper });

    let resp: any;
    await act(async () => {
      resp = await result.current.signUp('exists@example.com', 'pw');
    });

    expect(mockSupabaseAuth.signUp).toHaveBeenCalled();
    expect(resp.error).toBeDefined();
    // Backwards compatible: error.message still present
    expect(resp.error.message).toBe('Email exists');
  });

  it('restores session on mount when a session exists (persistence)', async () => {
    const wrapper = ({ children }: any) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const session = createMockSession();

    const { result } = renderHook(() => UserAuth(), { wrapper });

    // simulate auth state change to signed in without explicit signIn call
    act(() => createMockAuthStateChangeCallback('SIGNED_IN', session));

    await waitFor(() => expect(result.current.session).toEqual(session));
  });

  it('updates session when TOKEN_REFRESHED event occurs', async () => {
    const wrapper = ({ children }: any) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const session = createMockSession();
    const refreshedSession = { ...session, access_token: 'refreshed-token' };

    const { result } = renderHook(() => UserAuth(), { wrapper });

    act(() => createMockAuthStateChangeCallback('SIGNED_IN', session));
    await waitFor(() => expect(result.current.session).toEqual(session));

    // simulate token refresh
    act(() => createMockAuthStateChangeCallback('TOKEN_REFRESHED', refreshedSession));
    await waitFor(() => expect(result.current.session).toEqual(refreshedSession));
  });

  it('provides expected values and same references to multiple consumers', () => {
    const components: any[] = [];

    const ConsumerA = () => {
      const auth = UserAuth();
      components.push(auth);
      return null;
    };

    const ConsumerB = () => {
      const auth = UserAuth();
      components.push(auth);
      return null;
    };

    const { container } = render(
      <AuthContextProvider>
        <ConsumerA />
        <ConsumerB />
      </AuthContextProvider>
    );

    // both consumers should have been pushed
    expect(components.length).toBeGreaterThanOrEqual(2);
    const a = components[0];
    const b = components[1];

    // check presence of expected keys
    expect(typeof a.signUp).toBe('function');
    expect(typeof a.signIn).toBe('function');
    expect(typeof a.signOut).toBe('function');
    expect('session' in a).toBe(true);
    expect('loading' in a).toBe(true);

    // functions should be the same reference across consumers
    expect(a.signIn).toBe(b.signIn);
    expect(a.signUp).toBe(b.signUp);
    expect(a.signOut).toBe(b.signOut);
    // session reference should be same (initially null)
    expect(a.session).toBe(b.session);
  });
});
