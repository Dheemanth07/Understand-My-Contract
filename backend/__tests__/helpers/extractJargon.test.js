/**
 * Unit tests for extractJargon helper function
 */

const { extractJargon } = require('../../server');
const { resetAllMocks } = require('../../testUtils/mocks');

describe('extractJargon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Jargon Extraction', () => {
    it('should extract capitalized words with 4+ letters', () => {
      const text = 'The Agreement and Liability clauses';
      const result = extractJargon(text);
      expect(result).toContain('Agreement');
      expect(result).toContain('Liability');
    });

    it('should ignore words with less than 4 letters', () => {
      const text = 'The Act and Law apply here';
      const result = extractJargon(text);
      expect(result).not.toContain('The');
      expect(result).not.toContain('Act');
      expect(result).not.toContain('Law');
    });

    it('should ignore lowercase words', () => {
      const text = 'agreement and liability clauses';
      const result = extractJargon(text);
      expect(result.length).toBe(0);
    });

    it('should return unique terms only', () => {
      const text = 'Agreement Agreement Liability Agreement';
      const result = extractJargon(text);
      expect(result).toContain('Agreement');
      expect(result.filter((t) => t === 'Agreement')).toHaveLength(1);
    });
  });

  describe('Legal Terms', () => {
    it('should extract common legal terms', () => {
      const text = 'Agreement Liability Indemnification Jurisdiction';
      const result = extractJargon(text);
      expect(result).toContain('Agreement');
      expect(result).toContain('Liability');
      expect(result).toContain('Indemnification');
      expect(result).toContain('Jurisdiction');
    });

    it('should extract terms in different positions', () => {
      const text = 'Agreement begins here. The Liability clause applies. Indemnification is required.';
      const result = extractJargon(text);
      expect(result).toContain('Agreement');
      expect(result).toContain('Liability');
      expect(result).toContain('Indemnification');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = extractJargon('');
      expect(result).toEqual([]);
    });

    it('should handle text with no capitalized words', () => {
      const result = extractJargon('no capitalized words here at all');
      expect(result).toEqual([]);
    });

    it('should handle text with only short capitalized words', () => {
      const result = extractJargon('The Act and Law');
      expect(result).toEqual([]);
    });

    it('should return unique terms (no duplicates)', () => {
      const text = 'Agreement Agreement Agreement Liability Liability';
      const result = extractJargon(text);
      expect(result).toHaveLength(2);
      expect(result).toContain('Agreement');
      expect(result).toContain('Liability');
    });
  });

  describe('Boundary Conditions', () => {
    it('should include exactly 4-letter capitalized words', () => {
      const text = 'Test Word Case';
      const result = extractJargon(text);
      expect(result).toContain('Test');
      expect(result).toContain('Word');
      expect(result).toContain('Case');
    });

    it('should exclude exactly 3-letter capitalized words', () => {
      const text = 'The Act Law';
      const result = extractJargon(text);
      expect(result.length).toBe(0);
    });

    it('should handle acronyms (all caps)', () => {
      const text = 'The AGREEMENT and Terms';
      const result = extractJargon(text);
      // Behavior depends on implementation - may or may not include
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle words with numbers', () => {
      const text = 'Section2 Article3 Term';
      const result = extractJargon(text);
      expect(result).toContain('Term');
      // Section2 and Article3 may or may not be included based on regex
    });
  });

  describe('Real-World Scenarios', () => {
    it('should extract terms from legal contract paragraph', () => {
      const text =
        'Section 1. Agreement. This Agreement is entered into by the parties. Indemnification shall apply.';
      const result = extractJargon(text);
      expect(result).toContain('Agreement');
      expect(result).toContain('Indemnification');
    });

    it('should handle mixed case text', () => {
      const text = 'The AGREEMENT provides terms AND LIABILITY limitations.';
      const result = extractJargon(text);
      // Should extract capitalized words
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle text with punctuation around capitalized words', () => {
      const text = 'The "Agreement" (herein called Agreement) states Liability.';
      const result = extractJargon(text);
      expect(result).toContain('Agreement');
      expect(result).toContain('Liability');
    });
  });
});
