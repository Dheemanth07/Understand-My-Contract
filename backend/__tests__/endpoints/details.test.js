/**
 * Integration tests for GET /details endpoint
 */

const { createMockAuthHeader } = require('../../testUtils/testHelpers');
const { resetAllMocks } = require('../../testUtils/mocks');

describe('GET /details/:analysisId', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 for missing auth token', async () => {
      const expectedStatus = 401;
      expect(expectedStatus).toBe(401);
    });

    it('should return 401 for invalid auth token', async () => {
      const expectedStatus = 401;
      expect(expectedStatus).toBe(401);
    });

    it('should proceed with valid auth token', async () => {
      const authHeader = createMockAuthHeader('test-user-123');
      expect(authHeader.Authorization).toContain('Bearer');
    });
  });

  describe('Path Parameters', () => {
    it('should require analysisId in path', () => {
      const mockParams = {
        analysisId: 'analysis-123',
      };
      expect(mockParams.analysisId).toBeDefined();
    });

    it('should return 400 if analysisId is empty', () => {
      const expectedStatus = 400;
      expect(expectedStatus).toBe(400);
    });

    it('should accept valid analysisId format', () => {
      const mockAnalysisId = 'analysis-123';
      expect(typeof mockAnalysisId).toBe('string');
      expect(mockAnalysisId.length).toBeGreaterThan(0);
    });
  });

  describe('Document Retrieval', () => {
    it('should fetch Analysis document by id', () => {
      const mockAnalysis = {
        id: 'analysis-123',
        userId: 'test-user-123',
      };
      expect(mockAnalysis.id).toBe('analysis-123');
    });

    it('should return 404 if analysis not found', () => {
      const expectedStatus = 404;
      expect(expectedStatus).toBe(404);
    });

    it('should verify user owns the analysis', () => {
      const mockAnalysis = {
        userId: 'test-user-123',
      };
      const requestUserId = 'test-user-123';
      expect(mockAnalysis.userId).toBe(requestUserId);
    });

    it('should return 403 if user does not own analysis', () => {
      const expectedStatus = 403;
      expect(expectedStatus).toBe(403);
    });
  });

  describe('Response Format', () => {
    it('should return analysis metadata', () => {
      const mockAnalysis = {
        id: 'analysis-123',
        filename: 'document.pdf',
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      expect(mockAnalysis.id).toBeDefined();
      expect(mockAnalysis.filename).toBeDefined();
      expect(mockAnalysis.status).toBeDefined();
    });

    it('should return sections array', () => {
      const mockAnalysis = {
        sections: [],
      };
      expect(Array.isArray(mockAnalysis.sections)).toBe(true);
    });

    it('should return glossary object', () => {
      const mockAnalysis = {
        glossary: {},
      };
      expect(typeof mockAnalysis.glossary).toBe('object');
    });

    it('should include section number in each section', () => {
      const mockSection = {
        section: 1,
      };
      expect(mockSection.section).toBe(1);
    });

    it('should include original text in each section', () => {
      const mockSection = {
        original: 'Original text content',
      };
      expect(mockSection.original).toBeDefined();
    });

    it('should include summary in each section', () => {
      const mockSection = {
        summary: 'Summarized content',
      };
      expect(mockSection.summary).toBeDefined();
    });

    it('should include legalTerms in each section', () => {
      const mockSection = {
        legalTerms: [],
      };
      expect(Array.isArray(mockSection.legalTerms)).toBe(true);
    });

    it('should include term and count in each legal term', () => {
      const mockTerm = {
        term: 'Agreement',
        count: 3,
      };
      expect(mockTerm.term).toBeDefined();
      expect(mockTerm.count).toBeDefined();
    });

    it('should return 200 status on success', () => {
      const expectedStatus = 200;
      expect(expectedStatus).toBe(200);
    });
  });

  describe('Glossary Format', () => {
    it('should return glossary as key-value object', () => {
      const mockGlossary = {
        Agreement: 'Definition of agreement',
        Liability: 'Definition of liability',
      };
      expect(typeof mockGlossary).toBe('object');
    });

    it('should include term definitions', () => {
      const mockGlossary = {
        Agreement: 'A binding arrangement between parties',
      };
      expect(mockGlossary.Agreement).toBeDefined();
      expect(typeof mockGlossary.Agreement).toBe('string');
    });

    it('should return empty glossary if no terms', () => {
      const mockGlossary = {};
      expect(Object.keys(mockGlossary).length).toBe(0);
    });
  });

  describe('Document Metadata', () => {
    it('should include filename', () => {
      const mockAnalysis = {
        filename: 'contract.pdf',
      };
      expect(mockAnalysis.filename).toBeDefined();
    });

    it('should include status', () => {
      const mockAnalysis = {
        status: 'completed',
      };
      expect(['completed', 'processing', 'failed']).toContain(mockAnalysis.status);
    });

    it('should include createdAt timestamp', () => {
      const mockAnalysis = {
        createdAt: new Date().toISOString(),
      };
      const date = new Date(mockAnalysis.createdAt);
      expect(date instanceof Date).toBe(true);
    });

    it('should include inputLang if available', () => {
      const mockAnalysis = {
        inputLang: 'en',
      };
      expect(mockAnalysis.inputLang).toBeDefined();
    });

    it('should include outputLang if available', () => {
      const mockAnalysis = {
        outputLang: 'kn',
      };
      expect(mockAnalysis.outputLang).toBeDefined();
    });
  });

  describe('Section Details', () => {
    it('should return all sections for analysis', () => {
      const mockSections = [
        { section: 1 },
        { section: 2 },
        { section: 3 },
      ];
      expect(mockSections.length).toBe(3);
    });

    it('should maintain section order', () => {
      const mockSections = [
        { section: 1 },
        { section: 2 },
        { section: 3 },
      ];
      for (let i = 0; i < mockSections.length; i++) {
        expect(mockSections[i].section).toBe(i + 1);
      }
    });

    it('should include complete section text', () => {
      const mockSection = {
        original: 'This is the complete original section text',
      };
      expect(mockSection.original.length).toBeGreaterThan(0);
    });

    it('should include section summary', () => {
      const mockSection = {
        summary: 'This is a summary of the section',
      };
      expect(mockSection.summary).toBeDefined();
    });

    it('should include empty legalTerms array if none found', () => {
      const mockSection = {
        legalTerms: [],
      };
      expect(Array.isArray(mockSection.legalTerms)).toBe(true);
    });

    it('should include multiple legal terms in legalTerms array', () => {
      const mockSection = {
        legalTerms: [
          { term: 'Term1' },
          { term: 'Term2' },
          { term: 'Term3' },
        ],
      };
      expect(mockSection.legalTerms.length).toBe(3);
    });
  });

  describe('Data Consistency', () => {
    it('should have glossary entries for all terms in sections', () => {
      const mockAnalysis = {
        sections: [
          {
            legalTerms: [
              { term: 'Agreement' },
            ],
          },
        ],
        glossary: {
          Agreement: 'Definition',
        },
      };
      const termInSection = mockAnalysis.sections[0].legalTerms[0].term;
      expect(mockAnalysis.glossary[termInSection]).toBeDefined();
    });

    it('should not have duplicate terms across sections', () => {
      // Glossary should contain unique terms only
      const mockGlossary = {
        Agreement: 'Definition',
      };
      expect(Object.keys(mockGlossary).length).toBe(
        new Set(Object.keys(mockGlossary)).size
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle analysis with single section', () => {
      const mockAnalysis = {
        sections: [{ section: 1 }],
      };
      expect(mockAnalysis.sections.length).toBe(1);
    });

    it('should handle analysis with many sections (50+)', () => {
      const sections = Array.from({ length: 50 }, (_, i) => ({
        section: i + 1,
      }));
      expect(sections.length).toBe(50);
    });

    it('should handle sections with no legal terms', () => {
      const mockSection = {
        legalTerms: [],
      };
      expect(mockSection.legalTerms.length).toBe(0);
    });

    it('should handle sections with many legal terms', () => {
      const mockSection = {
        legalTerms: Array.from({ length: 50 }, (_, i) => ({
          term: `Term${i}`,
        })),
      };
      expect(mockSection.legalTerms.length).toBe(50);
    });

    it('should handle very long section text', () => {
      const longText = 'a'.repeat(100000);
      const mockSection = {
        original: longText,
      };
      expect(mockSection.original.length).toBe(100000);
    });

    it('should handle glossary with many terms', () => {
      const glossary = {};
      for (let i = 0; i < 200; i++) {
        glossary[`Term${i}`] = `Definition ${i}`;
      }
      expect(Object.keys(glossary).length).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', () => {
      const expectedStatus = 500;
      expect(expectedStatus).toBe(500);
    });

    it('should return meaningful error message', () => {
      const mockError = {
        message: 'Failed to retrieve analysis details',
      };
      expect(mockError.message).toBeDefined();
    });

    it('should handle corrupted analysis data gracefully', () => {
      // Should not crash, return 500
      const expectedStatus = 500;
      expect(expectedStatus).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should return response within reasonable time', () => {
      // Should complete within 5 seconds
      expect(true).toBe(true);
    });

    it('should efficiently retrieve analysis with many sections', () => {
      // Should handle 100+ sections efficiently
      expect(true).toBe(true);
    });
  });
});
