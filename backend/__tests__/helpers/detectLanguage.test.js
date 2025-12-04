/**
 * Unit tests for detectLanguage helper function
 */

// Mock franc-min before importing the function
jest.mock('franc-min', () => ({
  franc: jest.fn((text, options) => {
    // Mock franc language detection
    if (text.includes('hello') || text.includes('english')) return 'eng';
    if (text.includes('namaste') || text.includes('hindi')) return 'hin';
    if (text.includes('vanakkam') || text.includes('tamil')) return 'tam';
    if (text.includes('namaskara') || text.includes('kannada')) return 'kan';
    return 'eng';
  }),
}));

const { detectLanguage } = require('../../server');
const { resetAllMocks } = require('../../testUtils/mocks');

describe('detectLanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Kannada Detection', () => {
    it('should detect Kannada text directly via unicode', async () => {
      const result = await detectLanguage('ಕನ್ನಡ ಭಾಷೆ');
      expect(result).toBe('kn');
    });

    it('should detect Kannada without calling external detection', async () => {
      const result = await detectLanguage('ಹೆಲೋ ವರ್ಲ್ಡ');
      expect(result).toBe('kn');
    });

    it('should handle mixed Kannada and English text', async () => {
      const result = await detectLanguage('Hello ಕನ್ನಡ world');
      expect(result).toBe('kn');
    });
  });

  describe('Language-Based Detection', () => {
    it('should detect English text', async () => {
      const result = await detectLanguage('This is English text');
      expect(result).toBe('en');
      expect(franc).toHaveBeenCalled();
    });

    it('should detect Hindi text', async () => {
      const result = await detectLanguage('नमस्ते हिंदी');
      expect(result).toBe('hi');
    });

    it('should detect Tamil text', async () => {
      const result = await detectLanguage('வணக்கம் தமிழ்');
      expect(result).toBe('ta');
    });

    it('should detect Telugu text', async () => {
      const result = await detectLanguage('నమస్కారం తెలుగు');
      expect(result).toBe('te');
    });

    it('should default to English for unknown languages', async () => {
      franc.mockReturnValue('unknown');
      const result = await detectLanguage('Unknown language text');
      expect(result).toBe('en');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', async () => {
      const result = await detectLanguage('');
      expect(result).toBe('en');
    });

    it('should handle very long text', async () => {
      const longText = 'This is a very long English text. '.repeat(100);
      const result = await detectLanguage(longText);
      expect(result).toBe('en');
    });

    it('should handle text with special characters', async () => {
      const result = await detectLanguage('!@#$%^&*()_+hello');
      expect(result).toBe('en');
    });

    it('should handle null input gracefully', async () => {
      const result = await detectLanguage(null);
      expect(result).toBe('en');
    });

    it('should handle undefined input gracefully', async () => {
      const result = await detectLanguage(undefined);
      expect(result).toBe('en');
    });
  });

  describe('Franc Integration', () => {
    it('should pass correct options to franc', async () => {
      await detectLanguage('hello world');
      expect(franc).toHaveBeenCalledWith(
        'hello world',
        expect.objectContaining({
          whitelist: expect.any(Array),
          minLength: 10,
        })
      );
    });

    it('should use whitelist of supported languages', async () => {
      await detectLanguage('test text');
      const callArgs = franc.mock.calls[franc.mock.calls.length - 1];
      const options = callArgs[1];
      expect(options.whitelist).toContain('eng');
      expect(options.whitelist).toContain('kan');
      expect(options.whitelist).toContain('hin');
    });

    it('should fallback to English on franc error', async () => {
      franc.mockImplementation(() => {
        throw new Error('Franc error');
      });
      const result = await detectLanguage('test');
      expect(result).toBe('en');
    });
  });

  describe('Multi-Script Text', () => {
    it('should prioritize Kannada script detection', async () => {
      const result = await detectLanguage('ಕನ್ನಡ some english');
      expect(result).toBe('kn');
      // Should not call franc since Kannada is detected by regex
      expect(franc).not.toHaveBeenCalled();
    });

    it('should use franc for non-Kannada scripts', async () => {
      franc.mockReturnValue('hin');
      const result = await detectLanguage('नमस्ते हिंदी');
      expect(result).toBe('hi');
      expect(franc).toHaveBeenCalled();
    });
  });
});
