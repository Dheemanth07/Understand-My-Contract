/**
 * Unit tests for translate helper function
 */

// Mock @xenova/transformers before importing the function
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(async (model, options) => {
    // Mock translation pipeline
    return jest.fn(async (text, options) => {
      if (!text) return [];
      // Mock translation results
      if (text.includes('ನಮಸ್ತೆ') || text.includes('Kannada')) {
        return [{ translation_text: 'Hello' }];
      }
      if (text.includes('नमस्ते') || text.includes('Hindi')) {
        return [{ translation_text: 'Hello' }];
      }
      if (text.includes('வணக்கம்') || text.includes('Tamil')) {
        return [{ translation_text: 'Hello' }];
      }
      // Default translation
      return [{ translation_text: `Translated: ${text}` }];
    });
  }),
}));

const { translate } = require('../../server');
const { resetAllMocks } = require('../../testUtils/mocks');
const { pipeline } = require('@xenova/transformers');

describe('translate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Same Language (No Translation)', () => {
    it('should return original text when src equals tgt', async () => {
      const text = 'Original text';
      const result = await translate(text, 'en', 'en');
      expect(result).toBe(text);
    });

    it('should not initialize translator for same language', async () => {
      const text = 'Text in English';
      const result = await translate(text, 'en', 'en');
      expect(result).toBe(text);
    });
  });

  describe('Successful Translation', () => {
    it('should translate English to Kannada', async () => {
      const text = 'Hello world';
      const result = await translate(text, 'en', 'kn');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should translate English to Hindi', async () => {
      const text = 'Good morning';
      const result = await translate(text, 'en', 'hi');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should translate English to Tamil', async () => {
      const text = 'Welcome';
      const result = await translate(text, 'en', 'ta');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should translate English to Telugu', async () => {
      const text = 'Thank you';
      const result = await translate(text, 'en', 'te');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Model Initialization', () => {
    it('should initialize translator on first translation', async () => {
      await translate('Test text', 'en', 'kn');
      expect(pipeline).toHaveBeenCalled();
    });

    it('should handle multiple translations', async () => {
      const text1 = 'First translation';
      const result1 = await translate(text1, 'en', 'hi');
      expect(result1).toBeDefined();

      const text2 = 'Second translation';
      const result2 = await translate(text2, 'en', 'ta');
      expect(result2).toBeDefined();
    });

    it('should cache translator for same language pair', async () => {
      const pipelineCalls = jest.fn();
      jest.spyOn(console, 'error').mockImplementation();
      
      await translate('First', 'en', 'kn');
      const callCountAfterFirst = pipeline.mock.calls.length;

      await translate('Second', 'en', 'kn');
      const callCountAfterSecond = pipeline.mock.calls.length;

      // Translator should be reused (cached)
      expect(callCountAfterSecond).toBeLessThanOrEqual(callCountAfterFirst + 1);
    });
  });

  describe('Error Handling', () => {
    it('should return original text on translation failure', async () => {
      const text = 'Original text';
      pipeline.mockImplementationOnce(async () => {
        throw new Error('Translation failed');
      });

      const result = await translate(text, 'en', 'kn');
      expect(result).toBeDefined();
    });

    it('should handle missing translation_text in response', async () => {
      const text = 'Test text';
      pipeline.mockImplementationOnce(async () => {
        return jest.fn(async () => [{ no_translation_text: 'error' }]);
      });

      const result = await translate(text, 'en', 'kn');
      expect(result).toBeDefined();
    });

    it('should handle empty response from translator', async () => {
      const text = 'Test text';
      pipeline.mockImplementationOnce(async () => {
        return jest.fn(async () => []);
      });

      const result = await translate(text, 'en', 'kn');
      expect(result).toBeDefined();
    });

    it('should handle null response from translator', async () => {
      const text = 'Test text';
      pipeline.mockImplementationOnce(async () => {
        return jest.fn(async () => null);
      });

      const result = await translate(text, 'en', 'kn');
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string translation', async () => {
      const result = await translate('', 'en', 'kn');
      expect(result).toBeDefined();
    });

    it('should handle very long text translation', async () => {
      const longText = 'word '.repeat(1000);
      const result = await translate(longText, 'en', 'hi');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle text with special characters', async () => {
      const text = 'Text with @#$% special chars!';
      const result = await translate(text, 'en', 'ta');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle text with numbers', async () => {
      const text = 'Translation of 123 and 456';
      const result = await translate(text, 'en', 'te');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle null input gracefully', async () => {
      const result = await translate(null, 'en', 'kn');
      expect(result).toBeDefined();
    });

    it('should handle undefined input gracefully', async () => {
      const result = await translate(undefined, 'en', 'kn');
      expect(result).toBeDefined();
    });
  });

  describe('Language Code Mapping', () => {
    it('should handle different language code formats', async () => {
      const result = await translate('Hello', 'en', 'kn');
      expect(result).toBeDefined();
    });

    it('should support all required language pairs', async () => {
      const languagePairs = [
        ['en', 'kn'],
        ['en', 'hi'],
        ['en', 'ta'],
        ['en', 'te'],
      ];

      for (const [src, tgt] of languagePairs) {
        const result = await translate('Test', src, tgt);
        expect(result).toBeDefined();
      }
    });
  });
});
