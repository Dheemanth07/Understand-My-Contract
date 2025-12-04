/**
 * Unit tests for splitIntoSections helper function
 */

const { splitIntoSections } = require('../../server');
const { resetAllMocks } = require('../../testUtils/mocks');

describe('splitIntoSections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Splitting', () => {
    it('should split text with double newlines correctly', () => {
      const text = 'Section 1\n\nSection 2\n\nSection 3';
      const result = splitIntoSections(text);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Section 1');
      expect(result[1]).toBe('Section 2');
      expect(result[2]).toBe('Section 3');
    });

    it('should trim sections', () => {
      const text = '  Section 1  \n\n  Section 2  ';
      const result = splitIntoSections(text);
      expect(result[0]).toBe('Section 1');
      expect(result[1]).toBe('Section 2');
    });

    it('should filter empty sections', () => {
      const text = 'Section 1\n\n\n\nSection 2';
      const result = splitIntoSections(text);
      expect(result).toHaveLength(2);
    });

    it('should handle text without any blank lines', () => {
      const text = 'Single continuous section with no splits';
      const result = splitIntoSections(text);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('Single continuous section with no splits');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = splitIntoSections('');
      expect(result).toEqual([]);
    });

    it('should handle null input', () => {
      const result = splitIntoSections(null);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle undefined input', () => {
      const result = splitIntoSections(undefined);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle single section without splits', () => {
      const text = 'Single section';
      const result = splitIntoSections(text);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('Single section');
    });

    it('should handle text with multiple consecutive newlines', () => {
      const text = 'Section 1\n\n\n\n\nSection 2';
      const result = splitIntoSections(text);
      expect(result).toHaveLength(2);
    });

    it('should handle text with only whitespace', () => {
      const text = '   \n\n\t  ';
      const result = splitIntoSections(text);
      expect(result).toEqual([]);
    });

    it('should preserve internal formatting within sections', () => {
      const text = 'Section 1\nWith internal line breaks\n\nSection 2\nAlso with breaks';
      const result = splitIntoSections(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toContain('internal');
      expect(result[1]).toContain('Also');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle legal document with numbered sections', () => {
      const text = 'Section 1. Introduction\nSub-section text.\n\nSection 2. Liability\nMore text here.';
      const result = splitIntoSections(text);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).toContain('Introduction');
    });

    it('should handle contract with paragraphs separated by blank lines', () => {
      const text =
        'This agreement is entered into.\n\nThe parties agree to terms.\n\nLiability is limited.';
      const result = splitIntoSections(text);
      expect(result).toHaveLength(3);
    });

    it('should handle document with mixed separators', () => {
      const text = 'Para 1\n\nPara 2\n\n\nPara 3';
      const result = splitIntoSections(text);
      expect(result).toHaveLength(3);
    });

    it('should handle legal terms and conditions', () => {
      const text = `TERMS AND CONDITIONS

By using this service, you agree.

LIMITATIONS

Liability is capped at $100.

DISPUTE RESOLUTION

Binding arbitration applies.`;
      const result = splitIntoSections(text);
      expect(result.length).toBeGreaterThan(2);
      expect(result.some((s) => s.includes('LIMITATIONS'))).toBe(true);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle very long text', () => {
      const longSection = 'word '.repeat(1000);
      const text = `${longSection}\n\n${longSection}`;
      const result = splitIntoSections(text);
      expect(result).toHaveLength(2);
      expect(result[0].length).toBeGreaterThan(1000);
    });

    it('should handle text with different line ending patterns', () => {
      const text1 = 'Section 1\n\nSection 2';
      const result1 = splitIntoSections(text1);
      expect(result1).toHaveLength(2);
    });

    it('should handle single words separated by blank lines', () => {
      const text = 'Word1\n\nWord2\n\nWord3';
      const result = splitIntoSections(text);
      expect(result).toEqual(['Word1', 'Word2', 'Word3']);
    });

    it('should handle many sections', () => {
      const sections = Array.from({ length: 100 }, (_, i) => `Section ${i + 1}`);
      const text = sections.join('\n\n');
      const result = splitIntoSections(text);
      expect(result).toHaveLength(100);
    });
  });

  describe('Return Type', () => {
    it('should always return an array', () => {
      expect(Array.isArray(splitIntoSections(''))).toBe(true);
      expect(Array.isArray(splitIntoSections('text'))).toBe(true);
      expect(Array.isArray(splitIntoSections('text\n\nmore'))).toBe(true);
    });

    it('should return array of strings', () => {
      const text = 'Section 1\n\nSection 2';
      const result = splitIntoSections(text);
      result.forEach((section) => {
        expect(typeof section).toBe('string');
      });
    });
  });
});
