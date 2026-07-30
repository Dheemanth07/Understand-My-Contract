import { jest } from '@jest/globals';

jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(async (token) => {
        if (token && token !== 'invalid-token' && token !== 'expired-token') {
          return {
            data: {
              user: {
                id: 'user-' + token.substring(0, 5),
                email: 'test@example.com',
              },
            },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error('Invalid token') };
      }),
    },
  })),
}));

const { createClient } = await import('@supabase/supabase-js');
const { getUserFromToken, __setSupabaseClient } = await import('../../src/utils/auth.js');
const { resetAllMocks } = await import('../../testUtils/mocks.js');

/**
 * Unit tests for getUserFromToken helper function
 */

describe('getUserFromToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Token', () => {
    it('should return user for valid Bearer token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid-token-123',
        },
      };
      const user = await getUserFromToken(req);
      expect(user).toBeDefined();
      expect(user.id).toBe('user-valid');
    });

    it('should strip Bearer prefix correctly', async () => {
      const req = {
        headers: {
          authorization: 'Bearer token-abc',
        },
      };
      const user = await getUserFromToken(req);
      expect(user.id).toBe('user-token');
    });
  });

  describe('Invalid Token', () => {
    it('should return null for null request', async () => {
      const user = await getUserFromToken(null);
      expect(user).toBeNull();
    });

    it('should return null for request without headers', async () => {
      const user = await getUserFromToken({});
      expect(user).toBeNull();
    });

    it('should return null for request without authorization header', async () => {
      const req = { headers: {} };
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should return null for empty authorization header', async () => {
      const req = { headers: { authorization: '' } };
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should return null for invalid token string', async () => {
      const req = { headers: { authorization: 'Bearer invalid-token' } };
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should return null for expired token', async () => {
      const req = { headers: { authorization: 'Bearer expired-token' } };
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });
  });

  describe('Mock Token Support', () => {
    it('should handle mock-token-123 specially', async () => {
      const req = {
        headers: {
          authorization: 'Bearer mock-token-123',
        },
      };
      const user = await getUserFromToken(req);
      expect(user).toEqual({
        id: 'mock-user-id',
        email: 'test_corp_user_123@legalsimplify.com',
      });
    });
  });

  describe('Caching Behavior', () => {
    it('should cache user response for subsequent requests', async () => {
      const req = {
        headers: {
          authorization: 'Bearer cache-token-1',
        },
      };
      const user1 = await getUserFromToken(req);
      const user2 = await getUserFromToken(req);
      expect(user1).toEqual(user2);
    });

    it('should handle getUser errors gracefully', async () => {
      const mockClient = createClient();
      mockClient.auth.getUser.mockImplementationOnce(async () => ({
        data: { user: null },
        error: new Error('Network error'),
      }));
      __setSupabaseClient && __setSupabaseClient(mockClient);

      const req = {
        headers: {
          authorization: 'Bearer test-token',
        },
      };
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });
  });
});
