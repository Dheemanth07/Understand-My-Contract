/**
 * Integration tests for GET /history/:id endpoint
 */

const request = require('supertest');
const { app, Analysis } = require('../../server');
const mongoose = require('mongoose');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(async (token) => {
        if (token === 'valid-token') {
          return {
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          };
        }
        if (token === 'other-user-token') {
          return {
            data: { user: { id: 'user-456', email: 'other@example.com' } },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error('Invalid token') };
      }),
    },
    from: jest.fn(() => ({
      delete: jest.fn().mockReturnValue({
        match: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })),
  })),
}));

describe('GET /history/:id', () => {
  let testDoc;

  beforeEach(async () => {
    jest.clearAllMocks();
    await Analysis.deleteMany({});

    // Create a test document
    testDoc = await Analysis.create({
      userId: 'user-123',
      filename: 'test-document.pdf',
      status: 'completed',
      mimeType: 'application/pdf',
      inputLang: 'en',
      outputLang: 'en',
      sections: [
        {
          original: 'Original section 1',
          summary: 'Summary 1',
          legalTerms: [{ term: 'Agreement', definition: 'A contract' }],
        },
      ],
      glossary: { Agreement: 'A contract between parties' },
    });
  });

  describe('Authentication', () => {
    it('should return 401 for missing auth token', async () => {
      const res = await request(app).get(`/history/${testDoc._id}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should return 401 for invalid auth token', async () => {
      const res = await request(app)
        .get(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('Successful Retrieval', () => {
    it('should return analysis document for owner', async () => {
      const res = await request(app)
        .get(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe('user-123');
      expect(res.body.filename).toBe('test-document.pdf');
      expect(res.body._id).toBeDefined();
    });

    it('should include all document fields', async () => {
      const res = await request(app)
        .get(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('filename');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('sections');
      expect(res.body).toHaveProperty('glossary');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('should include sections array with full details', async () => {
      const res = await request(app)
        .get(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.sections)).toBe(true);
      expect(res.body.sections.length).toBeGreaterThan(0);
      expect(res.body.sections[0]).toHaveProperty('original');
      expect(res.body.sections[0]).toHaveProperty('summary');
      expect(res.body.sections[0]).toHaveProperty('legalTerms');
    });

    it('should include glossary object', async () => {
      const res = await request(app)
        .get(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(typeof res.body.glossary).toBe('object');
      expect(res.body.glossary.Agreement).toBeDefined();
    });
  });

  describe('Access Control', () => {
    it('should return 404 for non-owner accessing document', async () => {
      const res = await request(app)
        .get(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer other-user-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');
    });

    it('should prevent users from accessing other users documents', async () => {
      // Create document for user-456
      const otherUserDoc = await Analysis.create({
        userId: 'user-456',
        filename: 'other-user-doc.pdf',
        status: 'completed',
      });

      // Try to access as user-123
      const res = await request(app)
        .get(`/history/${otherUserDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');
    });
  });

  describe('Invalid IDs', () => {
    it('should return 500 for invalid MongoDB ObjectId format', async () => {
      const res = await request(app)
        .get('/history/not-a-valid-id')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch analysis');
    });

    it('should return 404 for non-existent document ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/history/${nonExistentId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      const mockFindById = jest.spyOn(Analysis, 'findById')
        .mockRejectedValueOnce(new Error('DB connection failed'));

      const res = await request(app)
        .get(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch analysis');

      mockFindById.mockRestore();
    });
  });

  describe('Different Document States', () => {
    it('should return processing status document', async () => {
      const processingDoc = await Analysis.create({
        userId: 'user-123',
        filename: 'processing.pdf',
        status: 'processing',
        sections: [],
      });

      const res = await request(app)
        .get(`/history/${processingDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('processing');
    });

    it('should return failed status document', async () => {
      const failedDoc = await Analysis.create({
        userId: 'user-123',
        filename: 'failed.pdf',
        status: 'failed',
        sections: [],
      });

      const res = await request(app)
        .get(`/history/${failedDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('failed');
    });

    it('should return empty sections for new documents', async () => {
      const newDoc = await Analysis.create({
        userId: 'user-123',
        filename: 'new.pdf',
        status: 'processing',
        sections: [],
        glossary: {},
      });

      const res = await request(app)
        .get(`/history/${newDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.sections).toEqual([]);
    });
  });
});
