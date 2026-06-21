/**
 * Integration tests for POST /history/:id/stop endpoint
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
  })),
}));

describe('POST /history/:id/stop', () => {
  let testDoc;

  beforeEach(async () => {
    jest.clearAllMocks();
    await Analysis.deleteMany({});

    // Create a test document
    testDoc = await Analysis.create({
      userId: 'user-123',
      filename: 'test-document.pdf',
      status: 'processing',
      mimeType: 'application/pdf',
      sections: [
        {
          original: 'Original section 1',
          summary: 'Summary 1',
          legalTerms: [{ term: 'Agreement', definition: 'A contract' }],
        },
      ],
      glossary: { Agreement: 'A contract' },
    });
  });

  describe('Authentication', () => {
    it('should return 401 for missing auth token', async () => {
      const res = await request(app).post(`/history/${testDoc._id}/stop`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should return 401 for invalid auth token', async () => {
      const res = await request(app)
        .post(`/history/${testDoc._id}/stop`)
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('Successful Stop', () => {
    it('should stop document processing for owner and set status to completed', async () => {
      const res = await request(app)
        .post(`/history/${testDoc._id}/stop`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('processing stopped');

      // Verify status is updated to completed
      const updatedDoc = await Analysis.findById(testDoc._id);
      expect(updatedDoc.status).toBe('completed');
    });

    it('should not throw if the document status is already completed', async () => {
      await Analysis.updateOne({ _id: testDoc._id }, { $set: { status: 'completed' } });

      const res = await request(app)
        .post(`/history/${testDoc._id}/stop`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      
      const updatedDoc = await Analysis.findById(testDoc._id);
      expect(updatedDoc.status).toBe('completed');
    });
  });

  describe('Access Control', () => {
    it('should return 404 for non-owner trying to stop document', async () => {
      const res = await request(app)
        .post(`/history/${testDoc._id}/stop`)
        .set('Authorization', 'Bearer other-user-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');

      // Verify status is still processing
      const doc = await Analysis.findById(testDoc._id);
      expect(doc.status).toBe('processing');
    });
  });

  describe('Invalid IDs', () => {
    it('should return 500 for invalid MongoDB ObjectId format', async () => {
      const res = await request(app)
        .post('/history/not-a-valid-id/stop')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to stop processing');
    });

    it('should return 404 for non-existent document ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/history/${nonExistentId}/stop`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');
    });
  });
});
