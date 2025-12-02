import { jest } from '@jest/globals';

export const mockSupabaseAuth = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  signInWithOAuth: jest.fn(),
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

export const resetSupabaseMocks = () => {
  jest.clearAllMocks();
};

export const createMockSupabaseAuthResponse = (overrides = {}) => ({
  data: null,
  error: null,
  ...overrides,
});

export const createMockSupabaseQueryResponse = (overrides = {}) => ({
  data: [],
  error: null,
  status: 200,
  statusText: 'OK',
  ...overrides,
});
