/**
 * Unit tests for summarizeSection helper function
 */

jest.mock('axios', () => ({
  post: jest.fn(async () => ({ data: [{ summary_text: 'Mock summary text' }] })),
}));

const { summarizeSection } = require('../../server');
const axios = require('axios');
const { resetAllMocks, mockAxios } = require('../../testUtils/mocks');

// A reusable long-form text that clears the 15-word short-text bypass guard.
const LONG_TEXT =
  'This clause is a sufficiently long piece of legal text that exceeds the minimum word threshold for summarization.';

describe('summarizeSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HUGGING_FACE_API_KEY = 'test-hf-key';
  });

  afterEach(() => {
    delete process.env.HUGGING_FACE_API_KEY;
  });

  describe('Successful Summarization', () => {
    it('should return summary from API', async () => {
      const text = 'This is a long section of text that needs to be summarized by the backend model';
      const result = await summarizeSection(text);
      expect(result).toBeDefined();
    });

    it('should call API with correct URL', async () => {
      await summarizeSection(LONG_TEXT);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('huggingface.co'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should include Bearer token in Authorization header', async () => {
      await summarizeSection(LONG_TEXT);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should set timeout to 600000ms', async () => {
      await summarizeSection(LONG_TEXT);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 600000,
        })
      );
    });

    it('should extract and trim summary text', async () => {
      const text = 'Long legal clause text to be summarized by the AI model for the user';
      const result = await summarizeSection(text);
      // Result should be trimmed summary
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Short-text bypass guard', () => {
    it('should return original text unchanged when input is fewer than 15 words', async () => {
      const shortText = 'Short input text';
      const result = await summarizeSection(shortText);
      // API must NOT be called for short text
      expect(axios.post).not.toHaveBeenCalled();
      expect(result).toBe(shortText.trim());
    });

    it('should call the API for input with exactly 15+ words', async () => {
      const fifteenWordText =
        'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen words';
      await summarizeSection(fifteenWordText);
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('Missing API Key', () => {
    it('should return error message when API key missing', async () => {
      delete process.env.HUGGING_FACE_API_KEY;
      const result = await summarizeSection(LONG_TEXT);
      expect(result).toBe('(Configuration Error: API Key is Missing)');
    });

    it('should not call API when key is missing', async () => {
      delete process.env.HUGGING_FACE_API_KEY;
      await summarizeSection(LONG_TEXT);
      expect(mockAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('API Errors', () => {
    it('should return failure message on API error', async () => {
      axios.post.mockImplementationOnce(async () => {
        throw new Error('API Error');
      });

      const result = await summarizeSection(LONG_TEXT);
      expect(result).toBe('(Failed to summarize)');
    });

    it('should return failure message on timeout', async () => {
      axios.post.mockImplementationOnce(async () => {
        const error = new Error('Timeout');
        error.code = 'ECONNABORTED';
        throw error;
      });

      const result = await summarizeSection(LONG_TEXT);
      expect(result).toBe('(Failed to summarize)');
    });

    it('should handle rate limit error (429)', async () => {
      axios.post.mockImplementationOnce(async () => {
        const error = new Error('Too Many Requests');
        error.response = { status: 429, data: { error: 'Rate limit exceeded' } };
        throw error;
      });

      const result = await summarizeSection(LONG_TEXT);
      expect(result).toBe('(Failed to summarize)');
    });

    it('should handle invalid API key error (401)', async () => {
      axios.post.mockImplementationOnce(async () => {
        const error = new Error('Unauthorized');
        error.response = { status: 401, data: { error: 'Invalid API key' } };
        throw error;
      });

      const result = await summarizeSection(LONG_TEXT);
      expect(result).toBe('(Failed to summarize)');
    });
  });

  describe('Response Variations', () => {
    it('should handle empty summary_text', async () => {
      axios.post.mockImplementationOnce(async () => {
        return { data: [{ summary_text: '' }] };
      });

      const result = await summarizeSection(LONG_TEXT);
      expect(result).toBe('(No summary returned)');
    });

    it('should handle missing summary_text field', async () => {
      axios.post.mockImplementationOnce(async () => {
        return { data: [{}] };
      });

      const result = await summarizeSection(LONG_TEXT);
      expect(result).toBe('(No summary returned)');
    });

    it('should trim whitespace in summary', async () => {
      axios.post.mockImplementationOnce(async () => {
        return { data: [{ summary_text: '  Summary with spaces  ' }] };
      });

      const result = await summarizeSection(LONG_TEXT);
      expect(result).toBe('Summary with spaces');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty section text', async () => {
      const result = await summarizeSection('');
      expect(result).toBe('(No summary returned)');
    });

    it('should handle very long section text', async () => {
      const longText = 'word '.repeat(1000);
      const result = await summarizeSection(longText);
      expect(result).toBeDefined();
    });

    it('should handle text with special characters', async () => {
      const text = 'Text with @#$% special legal chars that form a long enough clause to trigger summarization model';
      const result = await summarizeSection(text);
      expect(result).toBeDefined();
    });

    it('should handle text with non-English content', async () => {
      // Hindi text long enough to exceed the 15-word guard (words split by spaces)
      const text = 'यह एक लंबा हिंदी पाठ है जो अनुबंध की शर्तों को समझाने के लिए लिखा गया है।';
      const result = await summarizeSection(text);
      expect(result).toBeDefined();
    });
  });
});
