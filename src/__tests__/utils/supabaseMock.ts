import { jest } from '@jest/globals';

// Authentication-related mocks (mimic Supabase v2 API shape)
export const mockSupabaseAuth: any = {
  signUp: jest.fn(async (opts: any) => ({ data: { user: null }, error: null })),
  signIn: jest.fn(async (opts: any) => ({ data: null, error: null })),
  // New method used by AuthContext
  signInWithPassword: jest.fn(async (opts: any) => ({ data: null, error: null })),
  signOut: jest.fn(async () => ({ error: null })),
  getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
  // This will store the last registered callback so tests can trigger it
  _onAuthStateChangeCallback: null as any,
  onAuthStateChange: jest.fn((cb: any) => {
    // Store callback and return a subscription-like object
    mockSupabaseAuth._onAuthStateChangeCallback = cb;
    const subscription = { unsubscribe: jest.fn() };
    return { data: { subscription } };
  }),
  signInWithOAuth: jest.fn(async (opts: any) => ({ data: null, error: null })),
};

export const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
};

export const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: jest.fn(() => mockSupabaseQuery),
};

let _defaultGetSession: any = null;

export const resetSupabaseMocks = (defaultSession: any = null) => {
  jest.clearAllMocks();
  mockSupabaseAuth._onAuthStateChangeCallback = null;
  _defaultGetSession = defaultSession;
  mockSupabaseAuth.getSession.mockImplementation(async () => ({ data: { session: _defaultGetSession }, error: null }));
};

export const createMockSession = (overrides: any = {}) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: now + 3600,
    provider_token: null,
    user: {
      id: 'user-id-1',
      email: 'test@example.com',
      user_metadata: { first_name: 'Test', last_name: 'User' },
      ...overrides.user,
    },
    ...overrides,
  };
};

export const createMockAuthError = (message = 'Auth error', options: any = {}) => ({
  message,
  name: options.name || undefined,
  status: options.status || undefined,
});

export const createMockAuthResponse = (session: any = null, error: any = null) => {
  if (error) return { data: null, error };
  return { data: { session }, error: null };
};

export const createMockAuthStateChangeCallback = (event: string, session: any) => {
  // Helper to trigger the stored callback
  if (typeof mockSupabaseAuth._onAuthStateChangeCallback === 'function') {
    mockSupabaseAuth._onAuthStateChangeCallback(event, session);
  }
};
