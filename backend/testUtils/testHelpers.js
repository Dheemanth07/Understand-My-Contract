/**
 * Comprehensive test helper utilities for backend testing
 * Mirrors frontend patterns from src/__tests__/utils/testHelpers.tsx
 */

/**
 * Create a mock multer file object
 * @param {Object} options - File options
 * @returns {Object} Mock file object
 */
function createMockFile(options = {}) {
  const {
    originalname = 'test.pdf',
    mimetype = 'application/pdf',
    size = 1024,
    buffer = Buffer.from('Mock file content'),
  } = options;

  return {
    originalname,
    mimetype,
    size,
    buffer,
  };
}

/**
 * Create a mock Supabase user object
 * @param {Object} overrides - User property overrides
 * @returns {Object} Mock user object
 */
function createMockUser(overrides = {}) {
  return {
    id: overrides.id || 'test-user-123',
    email: overrides.email || 'test@example.com',
    user_metadata: overrides.user_metadata || {
      first_name: 'Test',
      last_name: 'User',
    },
    ...overrides,
  };
}

/**
 * Create a mock Analysis document
 * @param {Object} overrides - Document property overrides
 * @returns {Object} Mock Analysis document
 */
function createMockAnalysis(overrides = {}) {
  const userId = overrides.userId || 'test-user-123';
  return {
    userId,
    filename: overrides.filename || 'test-document.pdf',
    status: overrides.status || 'completed',
    inputLang: overrides.inputLang || 'en',
    outputLang: overrides.outputLang || 'en',
    sections: overrides.sections || [
      {
        section: 1,
        original: 'Original text here',
        summary: 'Summarized text here',
        legalTerms: [{ term: 'Test', definition: 'A test definition' }],
      },
    ],
    glossary: overrides.glossary || { Test: 'A test definition' },
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides,
  };
}

/**
 * Create a mock section object
 * @param {Object} overrides - Section property overrides
 * @returns {Object} Mock section object
 */
function createMockSection(overrides = {}) {
  return {
    section: overrides.section || 1,
    original: overrides.original || 'Original section text',
    summary: overrides.summary || 'Summarized section text',
    legalTerms: overrides.legalTerms || [],
    ...overrides,
  };
}

/**
 * Create a Bearer token authentication header
 * @param {string} userId - User ID for token
 * @returns {Object} Authorization header object
 */
function createMockAuthHeader(userId = 'test-user-123') {
  const token = `valid-token-${userId}`;
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Create an authenticated supertest request
 * @param {Object} app - Express app instance
 * @param {string} method - HTTP method (get, post, delete, etc.)
 * @param {string} path - Request path
 * @param {string} userId - User ID for authentication
 * @returns {Object} Supertest request with auth header
 */
function createAuthenticatedRequest(app, method, path, userId = 'test-user-123') {
  const supertest = require('supertest');
  const req = supertest(app)[method](path);
  const authHeader = createMockAuthHeader(userId);
  return req.set(authHeader);
}

/**
 * Create a multipart form-data request with file upload
 * @param {Object} app - Express app instance
 * @param {string} path - Request path
 * @param {Object} file - Mock file object from createMockFile
 * @param {string} userId - User ID for authentication
 * @returns {Object} Supertest request with file and auth
 */
function createMultipartRequest(app, path, file, userId = 'test-user-123') {
  const supertest = require('supertest');
  const req = createAuthenticatedRequest(app, 'post', path, userId);
  return req.attach('file', file.buffer, file.originalname);
}

/**
 * Parse Server-Sent Events stream into array of data objects
 * @param {string} responseText - Raw SSE response text
 * @returns {Array} Array of parsed SSE data objects
 */
function parseSSEStream(responseText) {
  const events = [];
  const lines = responseText.split('\n');
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.substring(6);
      if (dataStr) {
        try {
          const data = JSON.parse(dataStr);
          events.push(data);
        } catch (e) {
          // Ignore parse errors
        }
      }
    } else if (line === '' && currentData) {
      currentData = '';
    }
  }

  return events;
}

/**
 * Wait for SSE stream to complete and return all sections
 * @param {Object} response - HTTP response object
 * @param {number} expectedSections - Expected number of sections
 * @returns {Array} Array of completed sections
 */
function waitForSSEComplete(response, expectedSections) {
  return new Promise((resolve, reject) => {
    const sections = [];
    let completed = false;

    const events = parseSSEStream(response.text || '');
    for (const event of events) {
      if (event.done) {
        completed = true;
      } else if (event.section !== undefined) {
        sections.push(event);
      }
    }

    if (completed && sections.length === expectedSections) {
      resolve(sections);
    } else {
      reject(new Error(`Expected ${expectedSections} sections, got ${sections.length}`));
    }
  });
}

/**
 * Clear all collections in test database
 * @param {Object} models - Object containing Mongoose models
 * @returns {Promise<void>}
 */
async function clearDatabase(models) {
  const modelEntries = Object.entries(models);
  for (const [, model] of modelEntries) {
    if (model && model.deleteMany) {
      await model.deleteMany({});
    }
  }
}

/**
 * Seed test database with initial data
 * @param {Object} models - Mongoose models
 * @param {Object} data - Data to seed
 * @returns {Promise<Object>} Seeded data
 */
async function seedDatabase(models, data) {
  const seededData = {};

  if (data.analyses && models.Analysis) {
    const analyses = await models.Analysis.insertMany(data.analyses);
    seededData.analyses = analyses;
  }

  return seededData;
}

/**
 * Create and save an analysis document in test database
 * @param {Object} model - Analysis model
 * @param {string} userId - User ID
 * @param {Object} data - Analysis data
 * @returns {Promise<Object>} Created analysis document
 */
async function createTestAnalysis(model, userId, data = {}) {
  const mockData = createMockAnalysis({ userId, ...data });
  return await model.create(mockData);
}

/**
 * Assert analysis object has required fields
 * @param {Object} analysis - Analysis document to validate
 */
function expectValidAnalysis(analysis) {
  if (!analysis) throw new Error('Analysis is null or undefined');
  if (!analysis.userId) throw new Error('Analysis missing userId');
  if (!analysis.filename) throw new Error('Analysis missing filename');
  if (!analysis.status) throw new Error('Analysis missing status');
  if (!Array.isArray(analysis.sections)) throw new Error('Analysis.sections is not an array');
  if (typeof analysis.glossary !== 'object') throw new Error('Analysis.glossary is not an object');
}

/**
 * Assert section has required fields
 * @param {Object} section - Section to validate
 */
function expectValidSection(section) {
  if (!section) throw new Error('Section is null or undefined');
  if (section.original === undefined) throw new Error('Section missing original');
  if (section.summary === undefined) throw new Error('Section missing summary');
  if (!Array.isArray(section.legalTerms)) throw new Error('Section.legalTerms is not an array');
}

/**
 * Assert response is authentication error
 * @param {Object} response - HTTP response object
 */
function expectAuthError(response) {
  if (response.status !== 401) {
    throw new Error(`Expected 401 status, got ${response.status}`);
  }
  if (!response.body || !response.body.error) {
    throw new Error('Response missing error message');
  }
}

module.exports = {
  createMockFile,
  createMockUser,
  createMockAnalysis,
  createMockSection,
  createMockAuthHeader,
  createAuthenticatedRequest,
  createMultipartRequest,
  parseSSEStream,
  waitForSSEComplete,
  clearDatabase,
  seedDatabase,
  createTestAnalysis,
  expectValidAnalysis,
  expectValidSection,
  expectAuthError,
};
