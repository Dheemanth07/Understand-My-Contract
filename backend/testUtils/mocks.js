/**
 * Centralized mock implementations for all external dependencies
 * Mirrors frontend patterns from src/__tests__/utils/supabaseMock.ts and apiMocks.ts
 */

// ============================================================================
// SUPABASE MOCK
// ============================================================================

let mockSupabaseAuthUser = null;
let mockSupabaseAuthError = null;
let tokenToUserMap = {};

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(async (token) => {
      if (mockSupabaseAuthError) {
        return { data: { user: null }, error: mockSupabaseAuthError };
      }

      // Check custom token map first
      if (tokenToUserMap[token]) {
        return { data: { user: tokenToUserMap[token] }, error: null };
      }

      // Check for valid-token pattern
      if (token && token.startsWith('valid-token')) {
        const userId = token.replace('valid-token-', '') || 'test-user-123';
        return {
          data: {
            user: { id: userId, email: `${userId}@example.com` },
          },
          error: null,
        };
      }

      // Invalid token
      return { data: { user: null }, error: { message: 'Invalid token' } };
    }),
  },
  from: jest.fn((tableName) => {
    if (tableName === 'uploads') {
      return {
        delete: jest.fn(async () => {
          return { data: null, error: null };
        }),
      };
    }
    return {};
  }),
};

function setMockSupabaseAuthUser(user) {
  mockSupabaseAuthUser = user;
}

function setMockSupabaseAuthError(error) {
  mockSupabaseAuthError = error;
}

function setMockTokenUser(token, user) {
  tokenToUserMap[token] = user;
}

function resetSupabaseMocks() {
  jest.clearAllMocks();
  mockSupabaseAuthUser = null;
  mockSupabaseAuthError = null;
  tokenToUserMap = {};
}

// ============================================================================
// MONGOOSE/MONGODB MOCK
// ============================================================================

const mockAnalysisModel = {
  create: jest.fn(async (data) => {
    const doc = { _id: 'mock-id', ...data };
    return doc;
  }),
  find: jest.fn(async (query) => {
    return [];
  }),
  findById: jest.fn(async (id) => {
    return null;
  }),
  findOne: jest.fn(async (query) => {
    return null;
  }),
  findOneAndDelete: jest.fn(async (query) => {
    return null;
  }),
  updateOne: jest.fn(async (query, update) => {
    return { modifiedCount: 1 };
  }),
  deleteMany: jest.fn(async (query) => {
    return { deletedCount: 0 };
  }),
};

function resetMongooseMocks() {
  jest.clearAllMocks();
}

// ============================================================================
// AXIOS MOCK
// ============================================================================

const mockAxios = {
  get: jest.fn(async (url, config) => {
    // Dictionary API mock
    if (url && url.includes('api.dictionaryapi.dev')) {
      const word = url.split('/').pop();
      if (word === 'unknown-word') {
        const error = new Error('Not Found');
        error.response = { status: 404, data: [] };
        throw error;
      }
      return {
        data: [
          {
            word: word,
            meanings: [
              {
                definitions: [
                  {
                    definition: `Definition of ${word}`,
                    example: `Example of ${word}`,
                  },
                ],
              },
            ],
          },
        ],
      };
    }
    return { data: null };
  }),

  post: jest.fn(async (url, data, config) => {
    // Hugging Face API mock
    if (url && url.includes('huggingface.co')) {
      if (!config || !config.headers || !config.headers.Authorization) {
        const error = new Error('Unauthorized');
        error.response = { status: 401, data: { error: 'Unauthorized' } };
        throw error;
      }

      return {
        data: [
          {
            summary_text: `Summary of the provided text`,
          },
        ],
      };
    }
    return { data: null };
  }),

  delete: jest.fn(async (url, config) => {
    return { data: null };
  }),
};

function resetAxiosMocks() {
  jest.clearAllMocks();
}

// ============================================================================
// FILE PROCESSING MOCKS
// ============================================================================

const mockPdfParse = jest.fn(async (buffer) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Invalid PDF buffer');
  }
  return {
    text: 'Mock extracted text from PDF\nThis is section one.\n\nThis is section two.',
    numpages: 1,
    info: {},
  };
});

const mockMammoth = {
  extractRawText: jest.fn(async ({ buffer }) => {
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid DOCX buffer');
    }
    return {
      value: 'Mock extracted text from DOCX\nThis is section one.\n\nThis is section two.',
      messages: [],
    };
  }),
};

function resetFileProcessingMocks() {
  jest.clearAllMocks();
}

// ============================================================================
// TRANSFORMERS MOCK
// ============================================================================

let mockTranslatorsInitialized = false;

const mockTransformersPipeline = jest.fn(async (task, model) => {
  mockTranslatorsInitialized = true;
  return jest.fn(async (input) => {
    const languagePair = model || 'en_to_en';
    return {
      translation_text: `Translated to ${languagePair}: ${input}`,
    };
  });
});

function resetTransformersMocks() {
  jest.clearAllMocks();
  mockTranslatorsInitialized = false;
}

// ============================================================================
// FRANC MOCK
// ============================================================================

const mockFranc = jest.fn((text) => {
  if (!text || text.length === 0) {
    return 'eng';
  }
  // Simple language detection based on content
  if (text.includes('ಕ')) return 'kan';
  if (text.includes('ह')) return 'hin';
  if (text.includes('த')) return 'tam';
  if (text.includes('త')) return 'tel';
  return 'eng';
});

function resetFrancMocks() {
  jest.clearAllMocks();
}

// ============================================================================
// RESET ALL MOCKS
// ============================================================================

function resetAllMocks() {
  resetSupabaseMocks();
  resetMongooseMocks();
  resetAxiosMocks();
  resetFileProcessingMocks();
  resetTransformersMocks();
  resetFrancMocks();
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Supabase
  mockSupabaseClient,
  setMockSupabaseAuthUser,
  setMockSupabaseAuthError,
  setMockTokenUser,
  resetSupabaseMocks,

  // Mongoose
  mockAnalysisModel,
  resetMongooseMocks,

  // Axios
  mockAxios,
  resetAxiosMocks,

  // File Processing
  mockPdfParse,
  mockMammoth,
  resetFileProcessingMocks,

  // Transformers
  mockTransformersPipeline,
  resetTransformersMocks,

  // Franc
  mockFranc,
  resetFrancMocks,

  // All
  resetAllMocks,
};
