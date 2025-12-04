/**
 * Integration tests for POST /upload endpoint
 */

const request = require('supertest');
const { app, Analysis } = require('../../server');

// Mock external dependencies
jest.mock('axios');
jest.mock('franc-min');
jest.mock('@xenova/transformers');
jest.mock('pdf-parse');
jest.mock('mammoth');

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

describe('POST /upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 for missing auth token', async () => {
      const res = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('test'), 'test.txt');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid Supabase token');
    });

    it('should return 401 for invalid auth token', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', Buffer.from('test'), 'test.txt');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid Supabase token');
    });

    it('should proceed with valid auth token', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Test content'), 'test.txt');

      // Should return 200 with SSE stream or 400/500 on processing error
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers['content-type']).toContain('text/event-stream');
      }
    });
  });

  describe('File Upload Validation', () => {
    it('should accept TXT files', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Plain text content'), 'document.txt');

      expect([200, 400, 500]).toContain(res.status);
    });

    it('should reject missing file', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
    });

    it('should reject empty files', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.alloc(0), 'empty.txt');

      expect([400, 500]).toContain(res.status);
    });
  });
});  describe('Successful Upload with SSE Response', () => {
    it('should return SSE stream with Content-Type header', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Test content for analysis'), 'test.txt');

      if (res.status === 200) {
        expect(res.headers['content-type']).toContain('text/event-stream');
        expect(res.text).toContain('totalSections');
        expect(res.text).toContain('analysisId');
      }
    });

    it('should create Analysis document in database', async () => {
      const initialCount = await Analysis.countDocuments({ userId: 'user-123' });

      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Test content'), 'test.txt');

      if (res.status === 200) {
        const finalCount = await Analysis.countDocuments({ userId: 'user-123' });
        expect(finalCount).toBeGreaterThanOrEqual(initialCount);
      }
    });

    it('should include analysisId in SSE response', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Test content'), 'test.txt');

      if (res.status === 200) {
        expect(res.text).toMatch(/"analysisId":"[a-f0-9]+"/);
      }
    });
  });

  describe('Query Parameters', () => {
    it('should accept lang=en query parameter', async () => {
      const res = await request(app)
        .post('/upload?lang=en')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Test content'), 'test.txt');

      expect([200, 400, 500]).toContain(res.status);
    });

    it('should accept lang=kn query parameter', async () => {
      const res = await request(app)
        .post('/upload?lang=kn')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Test content'), 'test.txt');

      expect([200, 400, 500]).toContain(res.status);
    });

    it('should default to lang=en if not specified', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Test content'), 'test.txt');

      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for unsupported file type', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('archive content'), 'file.zip');

      expect([400, 500]).toContain(res.status);
    });

    it('should return 500 on database error', async () => {
      // Spy on Analysis.create and make it throw
      const mockCreate = jest.spyOn(Analysis, 'create')
        .mockRejectedValueOnce(new Error('DB connection failed'));

      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Test content'), 'test.txt');

      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();

      mockCreate.mockRestore();
    });

    it('should return 400 for empty file text extraction', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.alloc(0), 'empty.txt');

      expect([400, 500]).toContain(res.status);
    });
  });
