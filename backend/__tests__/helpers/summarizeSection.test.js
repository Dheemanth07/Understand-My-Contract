/**
 * Unit tests for summarizeSection helper function
 */

jest.mock('axios', () => ({
  post: jest.fn(async () => ({ data: [{ summary_text: 'Mock summary text' }] })),
}));

const { summarizeSection } = require('../../server');
const axios = require('axios');
const { resetAllMocks } = require('../../testUtils/mocks');

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
      const text = 'This is a long section of text that needs to be summarized';
      const result = await summarizeSection(text);
      expect(result).toBeDefined();
    });

    it('should call API with correct URL', async () => {
      const text = 'Text to summarize';
      await summarizeSection(text);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('huggingface.co'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should include Bearer token in Authorization header', async () => {
      const text = 'Text to summarize';
      await summarizeSection(text);
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
      const text = 'Text to summarize';
      await summarizeSection(text);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 600000,
        })
      );
    });

    it('should extract and trim summary text', async () => {
      const text = 'Long text to be summarized here';
      const result = await summarizeSection(text);
      // Result should be trimmed summary
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Missing API Key', () => {
    it('should return error message when API key missing', async () => {
      delete process.env.HUGGING_FACE_API_KEY;
      const result = await summarizeSection('Some text');
      expect(result).toBe('(Configuration Error: API Key is Missing)');
    });

    it('should not call API when key is missing', async () => {
      delete process.env.HUGGING_FACE_API_KEY;
      await summarizeSection('Some text');
      expect(mockAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('API Errors', () => {
    it('should return failure message on API error', async () => {
      axios.post.mockImplementationOnce(async () => {
        throw new Error('API Error');
      });

      const result = await summarizeSection('Some text');
      expect(result).toBe('(Failed to summarize)');
    });

    it('should return failure message on timeout', async () => {
      axios.post.mockImplementationOnce(async () => {
        const error = new Error('Timeout');
        error.code = 'ECONNABORTED';
        throw error;
      });

      const result = await summarizeSection('Some text');
      expect(result).toBe('(Failed to summarize)');
    });

    it('should handle rate limit error (429)', async () => {
      axios.post.mockImplementationOnce(async () => {
        const error = new Error('Too Many Requests');
        error.response = { status: 429, data: { error: 'Rate limit exceeded' } };
        throw error;
      });

      const result = await summarizeSection('Some text');
      expect(result).toBe('(Failed to summarize)');
    });

    it('should handle invalid API key error (401)', async () => {
      axios.post.mockImplementationOnce(async () => {
        const error = new Error('Unauthorized');
        error.response = { status: 401, data: { error: 'Invalid API key' } };
        throw error;
      });

      const result = await summarizeSection('Some text');
      expect(result).toBe('(Failed to summarize)');
    });
  });

  describe('Response Variations', () => {
    it('should handle empty summary_text', async () => {
      axios.post.mockImplementationOnce(async () => {
        return { data: [{ summary_text: '' }] };
      });

      const result = await summarizeSection('Some text');
      expect(result).toBe('(No summary returned)');
    });

    it('should handle missing summary_text field', async () => {
      axios.post.mockImplementationOnce(async () => {
        return { data: [{}] };
      });

      const result = await summarizeSection('Some text');
      expect(result).toBe('(No summary returned)');
    });

    it('should trim whitespace in summary', async () => {
      axios.post.mockImplementationOnce(async () => {
        return { data: [{ summary_text: '  Summary with spaces  ' }] };
      });

      const result = await summarizeSection('Some text');
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
      const text = 'Text with @#$% special !@#$% chars';
      const result = await summarizeSection(text);
      expect(result).toBeDefined();
    });

    it('should handle text with non-English content', async () => {
      const text = 'नमस्ते विश्व'; // Hindi text
      const result = await summarizeSection(text);
      expect(result).toBeDefined();
    });
  });
});
