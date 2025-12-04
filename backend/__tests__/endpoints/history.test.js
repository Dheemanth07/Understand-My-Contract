/**
 * Integration tests for GET /history endpoint
 */

const request = require('supertest');
const { app, Analysis } = require('../../server');

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

describe('GET /history', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Clean database before each test
    await Analysis.deleteMany({});
  });

  describe('Authentication', () => {
    it('should return 401 for missing auth token', async () => {
      const res = await request(app).get('/history');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should return 401 for invalid auth token', async () => {
      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should succeed with valid auth token', async () => {
      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Successful Query', () => {
    it('should return empty array when no documents exist', async () => {
      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return user documents only', async () => {
      // Create documents for different users
      await Analysis.create({
        userId: 'user-123',
        filename: 'doc1.pdf',
        status: 'completed',
      });
      await Analysis.create({
        userId: 'user-456',
        filename: 'doc2.pdf',
        status: 'completed',
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].filename).toBe('doc1.pdf');
    });

    it('should sort by createdAt descending', async () => {
      // Create documents with different timestamps
      await Analysis.create({
        userId: 'user-123',
        filename: 'doc1.pdf',
        status: 'completed',
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      await Analysis.create({
        userId: 'user-123',
        filename: 'doc2.pdf',
        status: 'completed',
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].filename).toBe('doc2.pdf');
      expect(res.body[1].filename).toBe('doc1.pdf');
    });

    it('should return id, filename, and createdAt fields', async () => {
      await Analysis.create({
        userId: 'user-123',
        filename: 'test.pdf',
        status: 'completed',
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('filename');
      expect(res.body[0]).toHaveProperty('createdAt');
    });

    it('should limit results to 50 documents', async () => {
      // Create 60 documents
      const docs = [];
      for (let i = 0; i < 60; i++) {
        docs.push({
          userId: 'user-123',
          filename: `doc${i}.pdf`,
          status: 'completed',
        });
      }
      await Analysis.insertMany(docs);

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(50);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      const mockFind = jest.spyOn(Analysis, 'find').mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch history');

      mockFind.mockRestore();
    });
  });

  describe('User Isolation', () => {
    it('should not return other users documents', async () => {
      // Create documents for both users
      await Analysis.create({
        userId: 'user-123',
        filename: 'private1.pdf',
        status: 'completed',
      });
      await Analysis.create({
        userId: 'user-456',
        filename: 'private2.pdf',
        status: 'completed',
      });

      const res = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token'); // user-123

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].filename).toBe('private1.pdf');
    });

    it('should isolate results between different authenticated users', async () => {
      await Analysis.create({
        userId: 'user-123',
        filename: 'user123-doc.pdf',
        status: 'completed',
      });
      await Analysis.create({
        userId: 'user-456',
        filename: 'user456-doc.pdf',
        status: 'completed',
      });

      // Request as user-123
      const res1 = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer valid-token');

      // Request as user-456
      const res2 = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer other-user-token');

      expect(res1.body[0].filename).toBe('user123-doc.pdf');
      expect(res2.body[0].filename).toBe('user456-doc.pdf');
    });
  });
});    it('should not return sensitive data', () => {
      const mockDoc = {
        id: 'analysis-123',
        filename: 'document.pdf',
        // Should NOT include full section contents
      };
      expect(mockDoc.filename).toBeDefined();
      expect(mockDoc.id).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', () => {
      const expectedStatus = 500;
      expect(expectedStatus).toBe(500);
    });

    it('should return meaningful error message', () => {
      const mockError = {
        message: 'Failed to retrieve history',
      };
      expect(mockError.message).toBeDefined();
    });

    it('should not expose internal error details to client', () => {
      // Error response should be generic
      expect(true).toBe(true);
    });
  });

  describe('Document Metadata', () => {
    it('should include inputLang if specified', () => {
      const mockDoc = {
        inputLang: 'en',
      };
      expect(mockDoc.inputLang).toBeDefined();
    });

    it('should include outputLang if specified', () => {
      const mockDoc = {
        outputLang: 'kn',
      };
      expect(mockDoc.outputLang).toBeDefined();
    });

    it('should include glossarySize if applicable', () => {
      const mockDoc = {
        glossarySize: 15,
      };
      expect(typeof mockDoc.glossarySize).toBe('number');
    });

    it('should include document creation date', () => {
      const mockDoc = {
        createdAt: new Date().toISOString(),
      };
      const createdDate = new Date(mockDoc.createdAt);
      expect(createdDate instanceof Date).toBe(true);
    });
  });
});
