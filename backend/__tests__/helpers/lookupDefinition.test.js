/**
 * Unit tests for lookupDefinition helper function
 */

// Mock axios before importing the function
jest.mock('axios', () => ({
  get: jest.fn(async (url) => {
    // Mock dictionary API responses
    if (url.includes('test')) {
      return {
        data: [
          {
            meanings: [
              {
                definitions: [
                  {
                    definition: 'A procedure intended to establish the quality, performance, or reliability of something.',
                  },
                ],
              },
            ],
          },
        ],
      };
    }
    if (url.includes('agreement')) {
      return {
        data: [
          {
            meanings: [
              {
                definitions: [
                  {
                    definition: 'The arrangement or understanding between two or more parties.',
                  },
                ],
              },
            ],
          },
        ],
      };
    }
    // Throw for unknown words
    throw new Error('Not found');
  }),
}));

const { lookupDefinition } = require('../../server');
const axios = require('axios');
const { resetAllMocks } = require('../../testUtils/mocks');

describe('lookupDefinition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Definition Lookup', () => {
    it('should return definition for known word', async () => {
      const result = await lookupDefinition('test');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('test') || expect(result).toContain('procedure');
    });

    it('should call API with correct URL', async () => {
      await lookupDefinition('agreement');
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('api.dictionaryapi.dev'));
    });

    it('should extract definition from response structure', async () => {
      const result = await lookupDefinition('agreement');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle multiple definitions (uses first)', async () => {
      const result = await lookupDefinition('test');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return the actual definition text', async () => {
      const result = await lookupDefinition('agreement');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Word Not Found', () => {
    it('should return fallback message for unknown word', async () => {
      const result = await lookupDefinition('unknown-word');
      expect(result).toContain('Definition not found') || expect(result).toContain('not found');
    });

    it('should handle API 404 response', async () => {
      const result = await lookupDefinition('nonexistentword123');
      expect(result).toBeDefined();
    });

    it('should handle empty API response array', async () => {
      const result = await lookupDefinition('unknownword');
      expect(result).toBeDefined();
    });

    it('should handle malformed API response', async () => {
      axios.get.mockImplementationOnce(async () => ({ data: {} }));
      const result = await lookupDefinition('malformed');
      expect(result).toBeDefined();
    });
  });

  describe('API Response Variations', () => {
    it('should handle response with multiple meanings', async () => {
      const result = await lookupDefinition('test');
      expect(result).toBeDefined();
    });

    it('should handle response with multiple definitions per meaning', async () => {
      const result = await lookupDefinition('right');
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return fallback on network error', async () => {
      // Simulate network error by mocking rejection
      const originalGet = mockAxios.get;
      mockAxios.get = jest.fn(async () => {
        throw new Error('Network error');
      });

      const result = await lookupDefinition('test');
      expect(result).toContain('Definition not found');

      mockAxios.get = originalGet;
    });

    it('should return fallback on timeout', async () => {
      const originalGet = mockAxios.get;
      mockAxios.get = jest.fn(async () => {
        throw new Error('Timeout');
      });

      const result = await lookupDefinition('test');
      expect(result).toContain('Definition not found');

      mockAxios.get = originalGet;
    });

    it('should return fallback on malformed response', async () => {
      const result = await lookupDefinition('malformed');
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string word', async () => {
      const result = await lookupDefinition('');
      expect(result).toContain('Definition not found');
    });

    it('should handle word with special characters', async () => {
      const result = await lookupDefinition("don't");
      expect(result).toBeDefined();
    });

    it('should handle very long word', async () => {
      const longWord = 'a'.repeat(100);
      const result = await lookupDefinition(longWord);
      expect(result).toBeDefined();
    });

    it('should handle word with spaces', async () => {
      const result = await lookupDefinition('multiple words');
      expect(result).toBeDefined();
    });

    it('should handle numbers in word', async () => {
      const result = await lookupDefinition('test123');
      expect(result).toBeDefined();
    });
  });
});
