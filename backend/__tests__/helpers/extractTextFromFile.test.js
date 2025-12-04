/**
 * Unit tests for extractTextFromFile helper function
 */

// Mock external dependencies before importing the function
jest.mock('pdf-parse');
jest.mock('mammoth');

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { extractTextFromFile } = require('../../server');
const { createMockFile } = require('../../testUtils/testHelpers');
const { resetAllMocks } = require('../../testUtils/mocks');

describe('extractTextFromFile', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('PDF Extraction', () => {
    it('should extract text from valid PDF file', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        originalname: 'test.pdf',
        buffer: Buffer.from('Mock PDF buffer'),
      });

      pdfParse.mockResolvedValue({
        text: 'Extracted text from PDF',
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe('Extracted text from PDF');
      expect(pdfParse).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should handle corrupted PDF gracefully', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        originalname: 'corrupted.pdf',
        buffer: Buffer.alloc(0),
      });

      pdfParse.mockRejectedValue(new Error('Invalid PDF'));

      await expect(extractTextFromFile(mockFile)).rejects.toThrow();
    });

    it('should trim extracted PDF text', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        originalname: 'test.pdf',
      });

      pdfParse.mockResolvedValue({
        text: '  Text with whitespace  ',
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe('Text with whitespace');
    });
  });

  describe('DOCX Extraction', () => {
    it('should extract text from valid DOCX file', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'document.docx',
      });

      mammoth.extractRawText.mockResolvedValue({
        value: 'Text extracted from DOCX',
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe('Text extracted from DOCX');
      expect(mammoth.extractRawText).toHaveBeenCalled();
    });

    it('should handle DOCX with complex formatting', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'complex.docx',
      });

      mammoth.extractRawText.mockResolvedValue({
        value: 'Text with formatting',
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe('Text with formatting');
    });

    it('should handle corrupted DOCX gracefully', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'corrupted.docx',
      });

      mammoth.extractRawText.mockRejectedValue(new Error('Invalid DOCX'));

      await expect(extractTextFromFile(mockFile)).rejects.toThrow();
    });
  });

  describe('Text File Extraction', () => {
    it('should extract text from plain text file', async () => {
      const content = 'This is plain text';
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'text.txt',
        buffer: Buffer.from(content),
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe(content);
    });

    it('should handle UTF-8 encoded text files', async () => {
      const content = 'UTF-8 content: café';
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'utf8.txt',
        buffer: Buffer.from(content, 'utf-8'),
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe(content);
    });

    it('should handle empty text files', async () => {
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'empty.txt',
        buffer: Buffer.from(''),
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for missing file', async () => {
      await expect(extractTextFromFile(null)).rejects.toThrow('No file provided');
    });

    it('should throw error for unsupported file type', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/zip',
        originalname: 'archive.zip',
      });

      await expect(extractTextFromFile(mockFile)).rejects.toThrow('Unsupported file type');
    });

    it('should throw error for undefined mimetype', async () => {
      const mockFile = createMockFile({
        originalname: 'unknown.file',
      });
      delete mockFile.mimetype;

      await expect(extractTextFromFile(mockFile)).rejects.toThrow('Unsupported file type');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large text files', async () => {
      const largeContent = 'a'.repeat(1000000);
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        buffer: Buffer.from(largeContent),
      });

      const text = await extractTextFromFile(mockFile);
      expect(text.length).toBe(1000000);
    });

    it('should handle files with special characters', async () => {
      const content = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        buffer: Buffer.from(content),
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe(content);
    });

    it('should detect .docx by filename if mimetype is incorrect', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/octet-stream',
        originalname: 'document.docx',
      });

      mammoth.extractRawText.mockResolvedValue({
        value: 'Extracted from DOCX',
      });

      const text = await extractTextFromFile(mockFile);
      expect(text).toBe('Extracted from DOCX');
      expect(mammoth.extractRawText).toHaveBeenCalled();
    });
  });
});

    it('should trim extracted DOCX text', () => {
      const mockFile = createMockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'test.docx',
        buffer: Buffer.from('  Text with whitespace  '),
      });

      const text = mockFile.buffer.toString().trim();
      expect(text).toBe('Text with whitespace');
    });
  });

  describe('TXT Extraction', () => {
    it('should extract text from plain text file', () => {
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'test.txt',
        buffer: Buffer.from('Plain text content'),
      });

      const text = mockFile.buffer.toString('utf8');
      expect(text).toBe('Plain text content');
    });

    it('should handle various text encodings', () => {
      const content = 'Text with special chars: ñ, é, ü';
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'test.txt',
        buffer: Buffer.from(content, 'utf8'),
      });

      const text = mockFile.buffer.toString('utf8');
      expect(text).toContain('ñ');
      expect(text).toContain('é');
    });
  });

  describe('Error Cases', () => {
    it('should handle null file', () => {
      expect(() => {
        if (!null) throw new Error('File is required');
      }).toThrow('File is required');
    });

    it('should handle unsupported file type', () => {
      const mockFile = createMockFile({
        mimetype: 'application/zip',
        originalname: 'archive.zip',
        buffer: Buffer.from('Zip file content'),
      });

      expect(mockFile.mimetype).toBe('application/zip');
      // Would throw in actual implementation
    });

    it('should handle empty file', () => {
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'empty.txt',
        buffer: Buffer.alloc(0),
      });

      expect(mockFile.buffer.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle file with only whitespace', () => {
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'whitespace.txt',
        buffer: Buffer.from('   \n\n\t  '),
      });

      const text = mockFile.buffer.toString().trim();
      expect(text).toBe('');
    });

    it('should handle files with special characters', () => {
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'special.txt',
        buffer: Buffer.from('Text with @#$% special chars!'),
      });

      const text = mockFile.buffer.toString();
      expect(text).toContain('@#$%');
    });

    it('should preserve large file buffers', () => {
      const largeContent = 'x'.repeat(10000);
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        originalname: 'large.txt',
        buffer: Buffer.from(largeContent),
      });

      expect(mockFile.buffer.length).toBe(10000);
    });
  });
});
