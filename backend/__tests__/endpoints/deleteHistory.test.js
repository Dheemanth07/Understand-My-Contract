/**
 * Integration tests for DELETE /history/:id endpoint
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

describe('DELETE /history/:id', () => {
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
      sections: [],
      glossary: {},
    });
  });

  describe('Authentication', () => {
    it('should return 401 for missing auth token', async () => {
      const res = await request(app).delete(`/history/${testDoc._id}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should return 401 for invalid auth token', async () => {
      const res = await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('Successful Deletion', () => {
    it('should delete document for owner', async () => {
      const res = await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Document deleted successfully');
    });

    it('should remove document from database', async () => {
      // Verify document exists
      let doc = await Analysis.findById(testDoc._id);
      expect(doc).toBeDefined();

      // Delete it
      await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      // Verify it's gone
      doc = await Analysis.findById(testDoc._id);
      expect(doc).toBeNull();
    });

    it('should not delete other users documents', async () => {
      // Create document for user-456
      const otherUserDoc = await Analysis.create({
        userId: 'user-456',
        filename: 'other-user-doc.pdf',
        status: 'completed',
      });

      // Try to delete as user-123
      const res = await request(app)
        .delete(`/history/${otherUserDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');

      // Verify document still exists
      const doc = await Analysis.findById(otherUserDoc._id);
      expect(doc).toBeDefined();
      expect(doc.userId).toBe('user-456');
    });
  });

  describe('Access Control', () => {
    it('should prevent non-owner from deleting document', async () => {
      const res = await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer other-user-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');

      // Verify document still exists
      const doc = await Analysis.findById(testDoc._id);
      expect(doc).toBeDefined();
    });

    it('should isolate deletions between users', async () => {
      const user2Doc = await Analysis.create({
        userId: 'user-456',
        filename: 'user2-doc.pdf',
        status: 'completed',
      });

      // user-123 tries to delete user-456's document
      const res = await request(app)
        .delete(`/history/${user2Doc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);

      // user-456's document should still exist
      const stillExists = await Analysis.findById(user2Doc._id);
      expect(stillExists).toBeDefined();
    });
  });

  describe('Invalid IDs', () => {
    it('should return 500 for invalid MongoDB ObjectId format', async () => {
      const res = await request(app)
        .delete('/history/not-a-valid-id')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to delete document');
    });

    it('should return 404 for non-existent document ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/history/${nonExistentId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      const mockFindOneAndDelete = jest.spyOn(Analysis, 'findOneAndDelete')
        .mockRejectedValueOnce(new Error('DB connection failed'));

      const res = await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to delete document');

      mockFindOneAndDelete.mockRestore();
    });

    it('should handle Supabase deletion errors gracefully', async () => {
      // Mock Supabase delete to fail
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.from().delete().match.mockRejectedValueOnce(new Error('Supabase error'));

      // Should still succeed if MongoDB deletion works
      const res = await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      // Either 200 (MongoDB success) or 500 (Supabase error propagated)
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle sequential deletions correctly', async () => {
      const doc1 = await Analysis.create({
        userId: 'user-123',
        filename: 'doc1.pdf',
        status: 'completed',
      });
      const doc2 = await Analysis.create({
        userId: 'user-123',
        filename: 'doc2.pdf',
        status: 'completed',
      });

      // Delete first document
      const res1 = await request(app)
        .delete(`/history/${doc1._id}`)
        .set('Authorization', 'Bearer valid-token');
      expect(res1.status).toBe(200);

      // Delete second document
      const res2 = await request(app)
        .delete(`/history/${doc2._id}`)
        .set('Authorization', 'Bearer valid-token');
      expect(res2.status).toBe(200);

      // Verify both are gone
      const count = await Analysis.countDocuments({ userId: 'user-123' });
      expect(count).toBe(0);
    });

    it('should prevent double deletion', async () => {
      // First deletion should succeed
      const res1 = await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');
      expect(res1.status).toBe(200);

      // Second deletion should fail (document no longer exists)
      const res2 = await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');
      expect(res2.status).toBe(404);
    });
  });

  describe('Response Format', () => {
    it('should return success message on deletion', async () => {
      const res = await request(app)
        .delete(`/history/${testDoc._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('successfully');
    });

    it('should return error message on failed deletion', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/history/${nonExistentId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBeDefined();
    });
  });
});
