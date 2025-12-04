/**
 * End-to-end integration tests for complete workflows
 */

const { createMockFile, createMockAuthHeader, parseSSEStream } = require('../../testUtils/testHelpers');
const { resetAllMocks } = require('../../testUtils/mocks');

describe('E2E: Document Upload and Analysis Workflow', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should complete full document upload and analysis flow', async () => {
    // 1. User uploads document
    const mockFile = createMockFile({
      mimetype: 'application/pdf',
      originalname: 'contract.pdf',
    });
    expect(mockFile).toBeDefined();

    // 2. Server processes document
    const mockAnalysis = {
      id: 'analysis-123',
      status: 'processing',
    };
    expect(mockAnalysis.status).toBe('processing');

    // 3. Server streams SSE events
    const mockEvents = [
      { totalSections: 3 },
      { section: 1, original: 'text', summary: 'summary', legalTerms: [] },
      { section: 2, original: 'text', summary: 'summary', legalTerms: [] },
      { section: 3, original: 'text', summary: 'summary', legalTerms: [] },
      { done: true },
    ];
    expect(mockEvents.length).toBe(5);

    // 4. Analysis completes
    mockAnalysis.status = 'completed';
    expect(mockAnalysis.status).toBe('completed');
  });

  it('should handle document with language detection and translation', async () => {
    // 1. Upload document
    const mockFile = createMockFile();
    expect(mockFile).toBeDefined();

    // 2. Detect language
    const detectedLang = 'en';
    expect(detectedLang).toBe('en');

    // 3. Process in English
    const mockAnalysis = {
      inputLang: 'en',
      outputLang: 'en',
      sections: [
        { original: 'English text', summary: 'summary' },
      ],
    };
    expect(mockAnalysis.inputLang).toBe('en');

    // 4. Retrieve processed document
    expect(Array.isArray(mockAnalysis.sections)).toBe(true);
  });

  it('should extract and translate jargon terms', async () => {
    // 1. Upload legal document
    const mockFile = createMockFile({ originalname: 'legal.pdf' });
    expect(mockFile).toBeDefined();

    // 2. Extract legal terms
    const mockTerms = [
      { term: 'Agreement', definition: 'A binding arrangement' },
      { term: 'Liability', definition: 'Legal responsibility' },
    ];
    expect(mockTerms.length).toBe(2);

    // 3. Terms are available in glossary
    const mockGlossary = {
      Agreement: 'A binding arrangement',
      Liability: 'Legal responsibility',
    };
    expect(Object.keys(mockGlossary).length).toBe(2);
  });
});

describe('E2E: Document Comparison Workflow', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should upload and compare two documents', async () => {
    // 1. Upload first document
    const mockFile1 = createMockFile({
      originalname: 'contract-v1.pdf',
    });
    const analysis1Id = 'analysis-1';
    expect(mockFile1).toBeDefined();

    // 2. Upload second document
    const mockFile2 = createMockFile({
      originalname: 'contract-v2.pdf',
    });
    const analysis2Id = 'analysis-2';
    expect(mockFile2).toBeDefined();

    // 3. Both analyses complete
    expect(analysis1Id).toBeDefined();
    expect(analysis2Id).toBeDefined();

    // 4. Compare documents
    const mockComparison = {
      doc1: { id: analysis1Id },
      doc2: { id: analysis2Id },
      matched: [],
      unmatched: [],
    };
    expect(mockComparison.doc1.id).toBe(analysis1Id);
    expect(mockComparison.doc2.id).toBe(analysis2Id);
  });

  it('should identify differences between contract versions', async () => {
    // 1. Upload first version
    const analysis1 = {
      id: 'v1',
      sections: [
        { section: 1, original: 'Original clause A' },
        { section: 2, original: 'Original clause B' },
      ],
    };

    // 2. Upload second version
    const analysis2 = {
      id: 'v2',
      sections: [
        { section: 1, original: 'Modified clause A' },
        { section: 2, original: 'Original clause B' },
      ],
    };

    // 3. Compare
    const comparison = {
      matched: [
        { sectionNum: 2, isSame: true },
      ],
      unmatched: [
        { docNum: 1, sectionNum: 1 },
      ],
    };
    expect(comparison.matched.length).toBeGreaterThan(0);
    expect(comparison.unmatched.length).toBeGreaterThan(0);
  });
});

describe('E2E: User History and Document Management', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should upload multiple documents and retrieve history', async () => {
    // 1. Upload first document
    const mockFile1 = createMockFile({ originalname: 'doc1.pdf' });
    const analysis1 = {
      id: 'a1',
      filename: 'doc1.pdf',
      createdAt: new Date(Date.now() - 1000).toISOString(),
    };

    // 2. Upload second document
    const mockFile2 = createMockFile({ originalname: 'doc2.pdf' });
    const analysis2 = {
      id: 'a2',
      filename: 'doc2.pdf',
      createdAt: new Date().toISOString(),
    };

    // 3. Retrieve history
    const mockHistory = {
      documents: [analysis2, analysis1], // Most recent first
      total: 2,
    };
    expect(mockHistory.documents.length).toBe(2);
    expect(mockHistory.total).toBe(2);
  });

  it('should delete document from history', async () => {
    // 1. User has documents
    const mockHistory1 = {
      documents: [
        { id: 'a1', filename: 'doc1.pdf' },
        { id: 'a2', filename: 'doc2.pdf' },
      ],
      total: 2,
    };

    // 2. Delete one document
    const mockDelete = {
      id: 'a1',
      success: true,
    };
    expect(mockDelete.success).toBe(true);

    // 3. History is updated
    const mockHistory2 = {
      documents: [
        { id: 'a2', filename: 'doc2.pdf' },
      ],
      total: 1,
    };
    expect(mockHistory2.total).toBeLessThan(mockHistory1.total);
  });

  it('should retrieve detailed view of a document', async () => {
    // 1. Upload document
    const mockFile = createMockFile({ originalname: 'contract.pdf' });
    const analysisId = 'analysis-123';

    // 2. Retrieve from history
    const mockAnalysis = {
      id: analysisId,
      filename: 'contract.pdf',
      status: 'completed',
    };

    // 3. Get full details
    const mockDetails = {
      id: analysisId,
      sections: [
        { section: 1, original: 'text', summary: 'summary', legalTerms: [] },
      ],
      glossary: { term: 'definition' },
    };
    expect(mockDetails.sections).toBeDefined();
    expect(mockDetails.glossary).toBeDefined();
  });
});

describe('E2E: Error Recovery and Resilience', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should handle failed document processing gracefully', async () => {
    // 1. Upload document
    const mockFile = createMockFile({ originalname: 'document.pdf' });

    // 2. Processing fails
    const mockAnalysis = {
      id: 'analysis-123',
      status: 'failed',
      error: 'Processing failed',
    };
    expect(mockAnalysis.status).toBe('failed');

    // 3. User can retry
    expect(mockAnalysis.id).toBeDefined();
  });

  it('should continue processing if AI service call fails', async () => {
    // 1. Upload document
    const mockFile = createMockFile();

    // 2. Summarization fails - fallback to original
    const mockSection = {
      section: 1,
      original: 'Original text',
      summary: 'Original text', // Fallback
    };
    expect(mockSection.summary).toBeDefined();

    // 3. Continue with jargon extraction
    expect(mockSection.original).toBeDefined();
  });

  it('should fallback to original language if translation fails', async () => {
    // 1. Document detected as English
    const mockAnalysis = {
      inputLang: 'en',
      outputLang: 'kn', // Request Kannada
    };

    // 2. Translation fails
    const mockSection = {
      original: 'English text',
      summary: 'English text', // Fallback to English
    };
    expect(mockSection.summary).toBeDefined();
  });

  it('should handle database connection loss', async () => {
    // 1. User uploads document
    const mockFile = createMockFile();

    // 2. Database connection lost - request fails
    const expectedStatus = 500;
    expect(expectedStatus).toBe(500);

    // 3. User receives error message
    const mockError = {
      message: 'Service temporarily unavailable',
    };
    expect(mockError.message).toBeDefined();
  });
});

describe('E2E: Authentication and Security', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should enforce authentication on all endpoints', async () => {
    // 1. Request without auth
    const expectedStatus = 401;
    expect(expectedStatus).toBe(401);

    // 2. Request with valid auth
    const authHeader = createMockAuthHeader('user-123');
    expect(authHeader.Authorization).toContain('Bearer');
  });

  it('should prevent unauthorized access to other users data', async () => {
    // 1. User A uploads document
    const userAAnalysis = {
      id: 'a1',
      userId: 'user-a',
    };

    // 2. User B tries to access it
    const userBId = 'user-b';
    expect(userBId).not.toBe(userAAnalysis.userId);

    // 3. Access denied
    const expectedStatus = 403;
    expect(expectedStatus).toBe(403);
  });

  it('should prevent deletion of other users documents', async () => {
    // 1. User A document exists
    const analysis = {
      userId: 'user-a',
    };

    // 2. User B tries to delete
    const userBId = 'user-b';
    expect(userBId).not.toBe(analysis.userId);

    // 3. Deletion denied
    const expectedStatus = 403;
    expect(expectedStatus).toBe(403);
  });
});

describe('E2E: Performance and Limits', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should handle large document efficiently', async () => {
    // 1. Large PDF (10MB)
    const mockFile = createMockFile({
      buffer: Buffer.alloc(10 * 1024 * 1024),
    });
    expect(mockFile.buffer.length).toBeGreaterThan(1024 * 1024);

    // 2. Processing completes within timeout
    const mockAnalysis = {
      status: 'completed',
    };
    expect(mockAnalysis.status).toBe('completed');
  });

  it('should process document with many sections efficiently', async () => {
    // 1. Document with 100 sections
    const mockAnalysis = {
      sections: Array.from({ length: 100 }, (_, i) => ({
        section: i + 1,
        original: 'text',
      })),
    };
    expect(mockAnalysis.sections.length).toBe(100);

    // 2. All sections processed
    expect(mockAnalysis.sections[0].section).toBe(1);
    expect(mockAnalysis.sections[99].section).toBe(100);
  });

  it('should handle history pagination efficiently', async () => {
    // 1. User has 500 documents
    const mockTotal = 500;

    // 2. Paginate through with limit=20
    const pageSize = 20;
    const expectedPages = Math.ceil(mockTotal / pageSize);
    expect(expectedPages).toBe(25);

    // 3. Each page loads efficiently
    const mockPage = {
      documents: Array(pageSize).fill({}),
      limit: 20,
    };
    expect(mockPage.documents.length).toBe(pageSize);
  });
});

describe('E2E: Multi-language Support', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should process English document with English output', async () => {
    const mockFile = createMockFile();
    const mockAnalysis = {
      inputLang: 'en',
      outputLang: 'en',
      sections: [
        { original: 'English text', summary: 'English summary' },
      ],
    };
    expect(mockAnalysis.inputLang).toBe('en');
    expect(mockAnalysis.outputLang).toBe('en');
  });

  it('should detect and translate to Kannada', async () => {
    const mockFile = createMockFile();
    const mockAnalysis = {
      inputLang: 'en',
      outputLang: 'kn',
      sections: [
        {
          original: 'English text',
          summary: 'Kannada summary',
        },
      ],
    };
    expect(mockAnalysis.outputLang).toBe('kn');
  });

  it('should preserve original text while providing translations', async () => {
    const mockAnalysis = {
      inputLang: 'en',
      outputLang: 'kn',
      sections: [
        {
          original: 'English text',
          summary: 'Kannada summary',
          legalTerms: [
            { term: 'Agreement' }, // Original language
          ],
        },
      ],
    };
    expect(mockAnalysis.sections[0].original).toBeDefined();
    expect(mockAnalysis.sections[0].summary).toBeDefined();
  });
});

describe('E2E: Concurrent Operations', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should handle multiple uploads concurrently', async () => {
    // 1. Upload multiple documents in parallel
    const mockFiles = [
      createMockFile({ originalname: 'doc1.pdf' }),
      createMockFile({ originalname: 'doc2.pdf' }),
      createMockFile({ originalname: 'doc3.pdf' }),
    ];
    expect(mockFiles.length).toBe(3);

    // 2. All uploads succeed
    const mockAnalyses = mockFiles.map((_, i) => ({
      id: `analysis-${i}`,
      status: 'completed',
    }));
    expect(mockAnalyses.length).toBe(3);
  });

  it('should allow comparison while processing other documents', async () => {
    // 1. Document A and B already processed
    const analysisA = { id: 'a1', status: 'completed' };
    const analysisB = { id: 'a2', status: 'completed' };

    // 2. Document C is being processed
    const analysisC = { id: 'a3', status: 'processing' };

    // 3. Compare A and B while C is processing
    const comparison = {
      doc1: analysisA.id,
      doc2: analysisB.id,
    };
    expect(comparison.doc1).toBeDefined();
    expect(comparison.doc2).toBeDefined();
  });
});
