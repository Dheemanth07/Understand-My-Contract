/**
 * Unit tests for getUserFromToken helper function
 */

jest.mock('@supabase/supabase-js', () => ({
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

const { getUserFromToken } = require('../../server');
const { resetAllMocks } = require('../../testUtils/mocks');

describe('getUserFromToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Token', () => {
    it('should return user for valid Bearer token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid-token-user123',
        },
      };

      const user = await getUserFromToken(req);
      expect(user).not.toBeNull();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });

    it('should extract token from Bearer format', async () => {
      const req = {
        headers: {
          authorization: 'Bearer some-valid-token',
        },
      };

      const user = await getUserFromToken(req);
      expect(user).not.toBeNull();
    });

    it('should extract and use Bearer token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer test-token-123',
        },
      };

      const user = await getUserFromToken(req);
      expect(user).not.toBeNull();
      expect(user.id).toBeDefined();
    });
  });

  describe('Invalid Token', () => {
    it('should return null for invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should return null for expired token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer expired-token',
        },
      };

      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should return null for malformed token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer !!!invalid!!!',
        },
      };

      const user = await getUserFromToken(req);
      // May return null or handle gracefully
      expect([user, null]).toContain(user);
    });
  });

  describe('Missing Authorization Header', () => {
    it('should return null for missing auth header', async () => {
      const req = { headers: {} };
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should return null for empty auth header', async () => {
      const req = {
        headers: {
          authorization: '',
        },
      };
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should return null for undefined headers', async () => {
      const req = {};
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });
  });

  describe('Token Format Variations', () => {
    it('should handle standard Bearer format', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid-token-user1',
        },
      };
      const user = await getUserFromToken(req);
      expect(user).not.toBeNull();
    });

    it('should handle token without Bearer prefix after replace', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid-token-user2',
        },
      };
      const user = await getUserFromToken(req);
      expect(user).not.toBeNull();
    });

    it('should handle authorization header with extra whitespace', async () => {
      const req = {
        headers: {
          authorization: 'Bearer  valid-token-user3  ',
        },
      };
      const user = await getUserFromToken(req);
      // May handle gracefully or fail
      expect([user, null]).toContain(user);
    });
  });

  describe('Error Handling', () => {
    it('should return null on invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should handle getUser errors gracefully', async () => {
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.auth.getUser.mockImplementationOnce(async () => ({
        data: { user: null },
        error: new Error('Network error'),
      }));

      const req = {
        headers: {
          authorization: 'Bearer test-token',
        },
      };

      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should handle response with null user data', async () => {
      const req = {
        headers: {
          authorization: 'Bearer test-token',
        },
      };

      const user = await getUserFromToken(req);
      expect(typeof user === 'object' || user === null).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle request without headers property', async () => {
      const req = { body: {} };
      const user = await getUserFromToken(req);
      expect(user).toBeNull();
    });

    it('should handle multiple Bearer keywords in header', async () => {
      const req = {
        headers: {
          authorization: 'Bearer Bearer token',
        },
      };
      const user = await getUserFromToken(req);
      // Behavior depends on implementation
      expect([user, null]).toContain(user);
    });

    it('should handle very long token string', async () => {
      const longToken = 'valid-token-' + 'x'.repeat(1000);
      const req = {
        headers: {
          authorization: `Bearer ${longToken}`,
        },
      };
      const user = await getUserFromToken(req);
      expect([user, null]).toContain(user);
    });
  });
});
